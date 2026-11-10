'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, RoundedBox } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { clamp01, live, near, remap, smooth, useUI } from '@/lib/state';
import { C, M, MO, S, mw } from './mats';
import Island from './Island';
import Module from './Module';

type V3 = [number, number, number];
type Pose = { p: V3; t: V3; p2?: V3; t2?: V3; side: number; my: number; dy?: number; fit?: number };

const SUN = new THREE.Vector3(-1, 5.9, -3.6);
const SUNSET = new THREE.Vector3(-7.2, 2.2, -7.5);

/** Câmera por capítulo. side: +1 joga a cena para a direita (card à esquerda). */
const POSES: Pose[] = [
  { p: [20.5, 16.5, 20.5], t: [0, 1.2, 0], side: 1, my: -0.14, fit: 1.02 },
  { p: [6.2, 6.0, 7.2], t: [-4.3, 1.2, 1.9], side: -1, my: 0.2 },
  { p: [17, 20, 24], t: [0.5, -1.4, 3], side: 1, my: 0.18 },
  { p: [4.9, 1.75, 1.25], t: [-0.3, 0.62, 0.72], side: -1, my: 0.12, fit: 0.68 },
  { p: [9.5, 6.6, 11.5], t: [0, 1.75, 0.4], side: 1, my: 0.17, fit: 0.66 },
  { p: [8.0, 5.2, 9.6], t: [0.8, 1.45, 0.7], side: -1, my: 0.18, fit: 0.7 },
  { p: [-1.6, 4.6, 12.8], t: [-3.4, 0.5, 4.2], p2: [12.6, 5.6, 9.2], t2: [4.6, 0.6, 1.6], side: 1, my: 0.2 },
  { p: [13.5, 10.5, 12.5], t: [0.6, 0.6, -1.2], side: -1, my: 0.2 },
  { p: [9, 26, 15], t: [0, 0, 0.5], side: 0, my: 0.2, dy: 0.2 },
];
const BG = ['#0E0F0C', '#0E0F0C', '#F5F1E6', '#0E0F0C', '#0E0F0C', '#0B0D0C', '#F5F1E6', '#0E0F0C', '#1D1009'].map((c) => new THREE.Color(c));

const A = { p: new THREE.Vector3(), t: new THREE.Vector3() };
const Bp = { p: new THREE.Vector3(), t: new THREE.Vector3() };
const v = new THREE.Vector3();
const v2 = new THREE.Vector3();

function evalPose(i: number, out: { p: THREE.Vector3; t: THREE.Vector3 }) {
  const P = POSES[i];
  out.p.fromArray(P.p);
  out.t.fromArray(P.t);
  if (P.p2 && P.t2) {
    const l = smooth(remap(live.local[i], 0.12, 0.8));
    out.p.lerp(v.fromArray(P.p2), l);
    out.t.lerp(v.fromArray(P.t2), l);
  }
  if (i === 0 && live.intro < 1) {
    const e = 1 - Math.pow(1 - live.intro, 3);
    v.copy(SUN).add(v2.set(3.2, 0.5, 4.4));
    out.p.lerpVectors(v, out.p, e);
    out.t.lerpVectors(SUN, out.t, e);
  }
}

function Rig() {
  const { camera, scene, size } = useThree();
  const cur = useRef({ p: new THREE.Vector3(15, 12.5, 15), t: new THREE.Vector3(), side: 1, my: 0, init: false });
  const bg = useMemo(() => new THREE.Color('#0E0F0C'), []);
  useEffect(() => {
    scene.background = bg;
  }, [scene, bg]);

  useFrame((_, dt) => {
    const portraitNow = size.width < size.height;
    const f = Math.min(8, Math.max(0, live.f));
    const i = Math.floor(f);
    const j = Math.min(8, i + 1);
    const u = smooth(f - i);
    evalPose(i, A);
    evalPose(j, Bp);
    A.p.lerp(Bp.p, u);
    A.t.lerp(Bp.t, u);
    const side = POSES[i].side + (POSES[j].side - POSES[i].side) * u;
    const myA = portraitNow ? POSES[i].my : POSES[i].dy ?? 0;
    const myB = portraitNow ? POSES[j].my : POSES[j].dy ?? 0;
    const my = myA + (myB - myA) * u;
    bg.copy(BG[i]).lerp(BG[j], u);

    // Em tela estreita a câmera recua para a cena caber na largura
    const aspect = size.width / size.height;
    const portrait = aspect < 1;
    const pf = (POSES[i].fit ?? 0.82) + ((POSES[j].fit ?? 0.82) - (POSES[i].fit ?? 0.82)) * u;
    const fit = Math.max(1, (portrait ? pf : 1.5) / aspect);
    v.copy(A.p).sub(A.t).multiplyScalar(fit).add(A.t);

    const c = cur.current;
    const k = live.snap || !c.init ? 1 : 1 - Math.exp(-dt * 4.5);
    c.init = true;
    c.p.lerp(v, k);
    c.t.lerp(A.t, k);
    c.side += (side - c.side) * k;
    c.my += (my - c.my) * k;

    camera.position.copy(c.p);
    camera.lookAt(c.t);
    // paralaxe do cursor
    camera.translateX(live.px * 0.35);
    camera.translateY(-live.py * 0.2);
    camera.lookAt(c.t);

    const cam = camera as THREE.PerspectiveCamera;
    const ox = portrait || live.flat ? 0 : -c.side * 0.215 * size.width;
    const oy = live.flat ? 0 : c.my * size.height;
    cam.setViewOffset(size.width, size.height, ox, oy, size.width, size.height);
  });
  return null;
}

function SunAndLights({ bloom }: { bloom: boolean }) {
  const sun = useRef<THREE.Group>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: C.sun, toneMapped: false }), []);
  const cDay = useMemo(() => new THREE.Color(C.sun).multiplyScalar(bloom ? 1.9 : 1), [bloom]);
  const cSet = useMemo(() => new THREE.Color('#FF9A2E').multiplyScalar(bloom ? 1.9 : 1), [bloom]);
  const lDay = useMemo(() => new THREE.Color('#FFF6C8'), []);
  const lSet = useMemo(() => new THREE.Color('#FF9B5C'), []);
  const mobile = useUI((s) => s.mobile);
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.3;
    return () => {
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  useFrame((state) => {
    const t = live.snap ? 0 : state.clock.elapsedTime;
    const k8 = smooth(remap(live.f, 7.3, 8));
    if (sun.current) {
      sun.current.position.lerpVectors(SUN, SUNSET, k8);
      sun.current.position.x += live.px * 0.5;
      sun.current.position.y += -live.py * 0.3 + Math.sin(t * 0.5) * 0.08;
      const s = 1 + k8 * 0.5;
      sun.current.scale.setScalar(s);
    }
    mat.color.copy(cDay).lerp(cSet, k8);
    if (key.current) {
      key.current.color.copy(lDay).lerp(lSet, k8);
      key.current.intensity = 2.5 - k8 * 0.9;
      key.current.position.set(-7 - k8 * 3, 11 - k8 * 6, 6);
    }
    if (hemi.current) hemi.current.intensity = 0.95 - k8 * 0.4;
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={['#E6F6FF', '#8A6A44', 0.95]} />
      <directionalLight
        ref={key}
        position={[-7, 11, 6]}
        intensity={2.5}
        color="#FFF6C8"
        castShadow
        shadow-mapSize={mobile ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />
      <directionalLight position={[9, 4, -7]} intensity={0.45} color="#9FE8FF" />
      <group ref={sun} position={SUN}>
        <Billboard>
          <mesh material={mat}>
            <circleGeometry args={[1.05, 48]} />
          </mesh>
          <mesh material={mat}>
            <ringGeometry args={[1.3, 1.52, 64]} />
          </mesh>
        </Billboard>
      </group>
    </>
  );
}

/** Cap. 5 — tablet flutuante com a prévia do app e pulsos de dados. */
function Digital() {
  const grp = useRef<THREE.Group>(null);
  const pulses = useRef<(THREE.Mesh | null)[]>([]);
  const camera = useThree((s) => s.camera);
  const TAB = useMemo(() => new THREE.Vector3(2.3, 2.9, 1.5), []);

  const { tex, ctx, curves, tubes, lineMat } = useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 768;
    cv.height = 512;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const esp = mw(0.6, 0.2, -0.05);
    const mk = (a: THREE.Vector3, b: THREE.Vector3, lift: number) =>
      new THREE.QuadraticBezierCurve3(a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, lift, 0)), b);
    const curves = [
      mk(mw(-0.18, 0.24, -0.12), esp, 0.9),
      mk(mw(-0.5, 0.29, 0.46), esp, 1.1),
      mk(mw(-0.45, 0.28, 0.51), esp, 0.7),
      mk(esp, new THREE.Vector3(2.3, 2.3, 1.5), 0.9),
    ];
    const tubes = curves.map((c) => new THREE.TubeGeometry(c, 40, 0.014, 6));
    const lineMat = new THREE.MeshBasicMaterial({ color: C.water, transparent: true, opacity: 0, depthWrite: false });
    return { tex, ctx: cv.getContext('2d')!, curves, tubes, lineMat };
  }, []);
  const last = useRef(-1);

  const draw = (t: number) => {
    const W = 768;
    const H = 512;
    ctx.fillStyle = '#12140F';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.sun;
    ctx.font = '700 26px monospace';
    ctx.fillText('DESOL · GÊMEO DIGITAL', 36, 54);
    ctx.strokeStyle = C.water;
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 76, 356, 36);
    ctx.fillStyle = C.water;
    ctx.font = '600 20px monospace';
    ctx.fillText('DEMO — DADOS SIMULADOS', 50, 101);
    ctx.strokeStyle = 'rgba(245,241,230,.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(36, 160 + i * 44);
      ctx.lineTo(W - 36, 160 + i * 44);
      ctx.stroke();
    }
    const line = (col: string, ph: number, amp: number, base: number) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let x = 0; x <= 60; x++) {
        const y = base - Math.sin(x * 0.16 + t * 0.9 + ph) * amp - Math.sin(x * 0.05 + ph) * amp * 0.8 - x * 0.6;
        if (x === 0) ctx.moveTo(36, y);
        else ctx.lineTo(36 + (x / 60) * (W - 72), y);
      }
      ctx.stroke();
    };
    line(C.brine, 0, 14, 300);
    line(C.water, 2, 10, 330);
    const cell = (x: number, label: string, val: string, col: string) => {
      ctx.fillStyle = 'rgba(245,241,230,.6)';
      ctx.font = '500 18px monospace';
      ctx.fillText(label, x, 408);
      ctx.fillStyle = col;
      ctx.font = '700 40px monospace';
      ctx.fillText(val, x, 456);
    };
    cell(36, 'TEMP. BACIA', `${(58 + Math.sin(t * 0.4) * 1.6).toFixed(1)} °C`, C.brine);
    cell(300, 'NÍVEL', `${(64 + Math.sin(t * 0.25) * 2).toFixed(0)} %`, C.water);
    cell(500, 'TDS · pH', 'bruto', '#F5F1E6');
    ctx.fillStyle = 'rgba(245,241,230,.5)';
    ctx.font = '500 16px monospace';
    ctx.fillText('origem: simulada', 36, 490);
    tex.needsUpdate = true;
  };

  useFrame((state) => {
    const t = live.snap ? 3 : state.clock.elapsedTime;
    const k = near(5, 0.25, 0.85);
    if (grp.current) {
      grp.current.visible = k > 0.01;
      grp.current.scale.setScalar(k * (1 + Math.sin(k * Math.PI) * 0.06) + 0.0001);
      grp.current.position.copy(TAB);
      grp.current.position.y += Math.sin(t * 0.9) * 0.06;
      grp.current.lookAt(camera.position);
    }
    lineMat.opacity = k * 0.38;
    if (k > 0.01 && (last.current < 0 || t - last.current > 0.2)) {
      last.current = t;
      draw(t);
    }
    pulses.current.forEach((m, i) => {
      if (!m) return;
      const c = curves[i % curves.length];
      const u = (t * 0.45 + i * 0.37) % 1;
      c.getPointAt(u, m.position);
      m.scale.setScalar(k * (0.7 + Math.sin(u * Math.PI) * 0.6) + 0.0001);
    });
  });

  return (
    <>
      <group ref={grp} visible={false}>
        <RoundedBox args={[2.5, 1.72, 0.09]} radius={0.04} smoothness={4} material={M.ink} castShadow />
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[2.34, 1.56]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      </group>
      {tubes.map((g, i) => (
        <mesh key={i} geometry={g} material={lineMat} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} ref={(m) => { pulses.current[i] = m; }} scale={0.0001}>
          <sphereGeometry args={[0.05, 12, 10]} />
          <meshBasicMaterial color={new THREE.Color(C.sun).multiplyScalar(1.6)} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

/** Cap. 3 — fundo escuro atrás do corte, para o diagrama ler limpo. */
function Backdrop() {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#0E0F0C', transparent: true, opacity: 0 }), []);
  useFrame(() => {
    const k = near(3, 0.3, 0.75);
    mat.opacity = k;
    if (ref.current) ref.current.visible = k > 0.01;
  });
  return (
    <mesh ref={ref} position={[-1.75, 4, 0.5]} rotation={[0, Math.PI / 2, 0]} material={mat} visible={false}>
      <planeGeometry args={[40, 16]} />
    </mesh>
  );
}

function Ready() {
  const done = useRef(0);
  useFrame(() => {
    if (done.current < 3) {
      done.current++;
      if (done.current === 3) useUI.getState().set({ ready: true });
    }
  });
  return null;
}

export default function Experience() {
  const mobile = useUI((s) => s.mobile);
  const bloom = !mobile;
  return (
    <Canvas
      shadows
      flat
      dpr={[1, mobile ? 1.5 : 1.75]}
      camera={{ fov: 28, near: 0.5, far: 140, position: [15, 12.5, 15] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
      }}
      onPointerMissed={() => {
        if (useUI.getState().layer && useUI.getState().chapter !== 4) useUI.getState().set({ layer: null });
      }}
    >
      <Rig />
      <SunAndLights bloom={bloom} />
      {/* os GLB baixam em paralelo; até lá o poster fica à mostra */}
      <Suspense fallback={null}>
        <Island />
        <group position={MO} scale={S}>
          <Module />
        </group>
        <Ready />
      </Suspense>
      <Digital />
      <Backdrop />
      {bloom && (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.55} luminanceThreshold={1.02} luminanceSmoothing={0.15} radius={0.7} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
