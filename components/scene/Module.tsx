'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import { live, near, remap, smooth, useUI } from '@/lib/state';
import { layers } from '@/lib/content';
import { C, M, MC, S, clipPlane } from './mats';

/**
 * Placeholder do módulo DeSol feito em código.
 * Nomes dos objetos = docs/04_BLENDER_3D.md (o GLB real entra no lugar deste arquivo).
 * Unidades locais em metros; o grupo pai aplica a escala S.
 */
const L = 1.14;
const D = 0.64;
const HF = 0.15;
const TAN = Math.tan((18 * Math.PI) / 180);
const HB = HF + TAN * D;
const Y0 = 0.05;
const T = 0.02;
const E = 0.04;
const YB = Y0 + T + E; // fundo da bacia

function wedge(depth: number, hF: number, hB: number, t: number) {
  const s = new THREE.Shape();
  const h = depth / 2;
  s.moveTo(h, 0);
  s.lineTo(-h, 0);
  s.lineTo(-h, hF);
  s.lineTo(h, hB);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false });
  g.rotateY(Math.PI / 2);
  g.translate(-t / 2, 0, 0);
  return g;
}

type V3 = [number, number, number];
type Mat = THREE.Material;

function B({ a, p, m, r = 0.006, rot }: { a: V3; p: V3; m: Mat; r?: number; rot?: V3 }) {
  const rad = Math.min(r, Math.min(a[0], a[1], a[2]) / 2 - 0.0005);
  return (
    <RoundedBox args={a} radius={Math.max(rad, 0.0005)} smoothness={3} position={p} rotation={rot} material={m} castShadow receiveShadow />
  );
}
function Cy({ r, h, p, m, rot, seg = 20 }: { r: number; h: number; p: V3; m: Mat; rot?: V3; seg?: number }) {
  return (
    <mesh position={p} rotation={rot} material={m} castShadow receiveShadow>
      <cylinderGeometry args={[r, r, h, seg]} />
    </mesh>
  );
}

/** Deslocamento de cada peça na vista explodida (metros locais). */
const EXPLODE: Record<string, V3> = {
  DS_Legs: [0, -0.06, 0],
  DS_Frame: [0, 0, 0],
  DS_Insulation: [0, 0.42, 0],
  DS_Basin: [0, 0.78, 0],
  DS_Water_Brine: [0, 0.95, 0],
  DS_Sensor_Temp: [0.12, 1.0, 0],
  DS_Gutter: [0, 1.1, 0],
  DS_Glass: [0, 1.28, 0],
  DS_Outlet: [-0.1, 0, 0.26],
  DS_Mineralizer: [-0.1, 0, 0.26],
  DS_Collector: [-0.14, 0, 0.3],
  DS_Water_Fresh: [-0.14, 0, 0.3],
  DS_Sensor_Level: [-0.14, 0.12, 0.3],
  DS_Sensor_TDS: [-0.14, 0.2, 0.3],
  DS_Electronics: [0.3, 0.08, 0],
  DS_Antenna: [0.3, 0.14, 0],
  DS_SolarPanel: [0.26, 0, -0.24],
};
const ORDER = Object.keys(EXPLODE);
/** Qual camada do cap. 4 cada objeto representa. */
const LAYER_OF: Record<string, string> = {
  DS_Legs: 'DS_Frame',
  DS_Frame: 'DS_Frame',
  DS_Insulation: 'DS_Insulation',
  DS_Basin: 'DS_Basin',
  DS_Water_Brine: 'DS_Water_Brine',
  DS_Gutter: 'DS_Gutter',
  DS_Glass: 'DS_Glass',
  DS_Sensor_Temp: 'DS_Sensors',
  DS_Sensor_Level: 'DS_Sensors',
  DS_Sensor_TDS: 'DS_Sensors',
  DS_Electronics: 'DS_Sensors',
  DS_Antenna: 'DS_Sensors',
};
const TAGS: { key: string; p: V3 }[] = [
  { key: 'DS_Glass', p: [L / 2 + 0.1, 0.31, 0.1] },
  { key: 'DS_Gutter', p: [L / 2 + 0.1, 0.17, 0.28] },
  { key: 'DS_Basin', p: [L / 2 + 0.06, YB + 0.03, 0.2] },
  { key: 'DS_Water_Brine', p: [L / 2 + 0.04, YB + 0.02, 0.1] },
  { key: 'DS_Insulation', p: [L / 2 + 0.06, 0.16, 0.2] },
  { key: 'DS_Frame', p: [L / 2 + 0.1, 0.1, 0.34] },
  { key: 'DS_Sensors', p: [L / 2 + 0.12, 0.3, -0.05] },
];

const vaporVert = /* glsl */ `
uniform float uTime; uniform float uAmt; uniform float uSize;
attribute float aSeed; varying float vA;
void main(){
  float life = fract(uTime*0.11 + aSeed);
  vec3 p = position;
  float top = 0.285 - p.z*0.325;
  p.y = mix(0.135, top, life);
  p.x += sin(uTime*0.8 + aSeed*40.0)*0.014;
  p.z += cos(uTime*0.6 + aSeed*31.0)*0.014;
  vA = smoothstep(0.0,0.25,life)*(1.0-smoothstep(0.7,1.0,life))*uAmt;
  vec4 mv = modelViewMatrix*vec4(p,1.0);
  gl_PointSize = uSize*(0.5+fract(aSeed*7.3)*0.9)/-mv.z;
  gl_Position = projectionMatrix*mv;
}`;
const vaporFrag = /* glsl */ `
varying float vA;
void main(){
  float d = length(gl_PointCoord-0.5);
  float a = smoothstep(0.5,0.0,d)*vA*0.3;
  gl_FragColor = vec4(0.93,0.98,1.0,a);
}`;

const DROPS = Array.from({ length: 9 }, (_, k) => ({
  x: -0.46 + ((k * 0.61) % 1) * 0.52,
  z: -0.26 + ((k * 0.37 + 0.13) % 1) * 0.36,
}));
const SALT = Array.from({ length: 7 }, (_, k) => ({
  x: -0.44 + ((k * 0.43) % 1) * 0.5,
  z: -0.2 + ((k * 0.71) % 1) * 0.4,
}));

export default function Module() {
  const refs = useRef<Record<string, THREE.Group | null>>({});
  const reg = (n: string) => (g: THREE.Group | null) => {
    refs.current[n] = g;
  };
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const chapter = useUI((s) => s.chapter);
  const layer = useUI((s) => s.layer);
  const hoverLayer = useUI((s) => s.hoverLayer);

  const g = useMemo(
    () => ({
      frameSide: wedge(D, HF, HB, T),
      insSide: wedge(D - 2 * T, HF - T - 0.02, HB - T - 0.02, E),
      shade: wedge(D - 2 * T - 2 * E, 0.07, HB - T - E - 0.03, 0.002),
      fresh: new THREE.BoxGeometry(0.155, 0.22, 0.155).translate(0, 0.11, 0),
      brine: new THREE.BoxGeometry(0.982, 0.018, 0.482).translate(0, 0.009, 0),
    }),
    [],
  );
  const own = useMemo(() => {
    const brine = MC.brine.clone();
    brine.clippingPlanes = [clipPlane];
    const shade = new THREE.MeshBasicMaterial({ color: C.ink, transparent: true, opacity: 0, clippingPlanes: [clipPlane] });
    const ray = new THREE.MeshBasicMaterial({ color: C.sun, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const glow = new THREE.MeshStandardMaterial({ color: C.sun, emissive: C.sun, emissiveIntensity: 1.2, clippingPlanes: [clipPlane] });
    const stream = MC.water.clone();
    stream.clippingPlanes = [clipPlane];
    const vapor = new THREE.ShaderMaterial({
      vertexShader: vaporVert,
      fragmentShader: vaporFrag,
      uniforms: { uTime: { value: 0 }, uAmt: { value: 0 }, uSize: { value: 60 } },
      transparent: true,
      depthWrite: false,
    });
    const vg = new THREE.BufferGeometry();
    const n = 320;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = (i * 0.618034) % 1;
      const b = (i * 0.754877) % 1;
      pos[i * 3] = -0.47 + a * 0.55;
      pos[i * 3 + 1] = 0.14;
      pos[i * 3 + 2] = -0.21 + b * 0.42;
      seed[i] = (i * 0.3819) % 1;
    }
    vg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    vg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    vg.boundingSphere = new THREE.Sphere(new THREE.Vector3(-0.2, 0.25, 0), 1);
    return { brine, shade, ray, glow, stream, vapor, vg, cBrine: new THREE.Color(C.brine), cHot: new THREE.Color('#FF8A2B'), cFresh: new THREE.Color(C.water) };
  }, []);

  const drops = useRef<(THREE.Mesh | null)[]>([]);
  const salt = useRef<(THREE.Mesh | null)[]>([]);
  const fresh = useRef<THREE.Mesh>(null);
  const streamRef = useRef<THREE.Mesh>(null);
  const brineRef = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    const t = live.snap ? 0 : state.clock.elapsedTime;
    const k = live.snap ? 1 : 1 - Math.exp(-dt * 9);
    const ui = useUI.getState();

    // Cap. 4 — vista explodida com mola suave e leve escalonamento por peça
    const e = near(4, 0.35, 0.95);
    ORDER.forEach((name, idx) => {
      const grp = refs.current[name];
      if (!grp) return;
      const d = EXPLODE[name];
      const ek = smooth(remap(e, idx * 0.02, 0.62 + idx * 0.02));
      const sel = e > 0.5 && ui.layer && LAYER_OF[name] === ui.layer ? 1 : 0;
      const hov = e > 0.5 && ui.hoverLayer && LAYER_OF[name] === ui.hoverLayer ? 1 : 0;
      grp.position.x += (d[0] * ek + sel * 0.1 - grp.position.x) * k;
      grp.position.y += (d[1] * ek + hov * 0.015 - grp.position.y) * k;
      grp.position.z += (d[2] * ek + sel * 0.1 - grp.position.z) * k;
    });

    // Cap. 3 — corte lateral + ciclo controlado pelo scroll
    const cut = near(3, 0.3, 0.8);
    clipPlane.constant = cut > 0.001 ? 0.2 + (1 - cut) * 3.2 : 100;
    own.shade.opacity = cut * 0.9;
    const p = cut > 0 ? remap(live.local[3], 0.14, 0.86) : 0;
    const heat = smooth(remap(p, 0.12, 0.32));
    const evap = smooth(remap(p, 0.3, 0.44));
    const fill = smooth(remap(p, 0.8, 1));
    own.ray.opacity = cut * smooth(remap(p, 0.1, 0.2)) * 0.5 * (0.85 + Math.sin(t * 2.2) * 0.15);
    own.brine.color.copy(own.cBrine).lerp(own.cHot, heat * cut);
    own.brine.emissive.copy(own.cHot);
    own.brine.emissiveIntensity = heat * cut * 0.55;
    if (brineRef.current) brineRef.current.scale.y = 1 - smooth(remap(p, 0.3, 0.9)) * 0.45 * cut;
    own.vapor.uniforms.uTime.value = t;
    own.vapor.uniforms.uAmt.value = cut * evap * (1 - smooth(remap(p, 0.92, 1)) * 0.4);
    own.vapor.uniforms.uSize.value = (0.042 * S * size.height * dpr) / 0.4986;
    salt.current.forEach((m, i) => {
      if (m) m.scale.setScalar(cut * smooth(remap(p, 0.34 + i * 0.03, 0.5 + i * 0.03)) + 0.0001);
    });
    drops.current.forEach((m, i) => {
      if (!m) return;
      const a = smooth(remap(p, 0.48 + i * 0.012, 0.6 + i * 0.012));
      const sl = smooth(remap(p, 0.64 + i * 0.014, 0.8 + i * 0.014));
      const z0 = DROPS[i].z;
      m.position.z = z0 + (0.3 - z0) * sl;
      const s = cut > 0.01 ? a * (1 - smooth(remap(sl, 0.9, 1))) : 0.45 + 0.1 * Math.sin(i * 2.1);
      m.scale.set(s, s * 0.6, s * (1 + sl * (1 - sl) * 2.4));
    });
    if (streamRef.current) {
      const fl = cut * smooth(remap(p, 0.72, 0.84));
      streamRef.current.scale.x = fl + 0.0001;
      streamRef.current.visible = fl > 0.01;
    }
    if (fresh.current) fresh.current.scale.y = cut > 0.01 ? 0.12 + fill * 0.75 : 0.55;

    // Cap. 5 — sensores acendem
    const dig = near(5, 0.3, 0.9);
    own.glow.emissiveIntensity = 1.2 + dig * (2.4 + Math.sin(t * 5) * 1.2);
  });

  const pick = (name: string) => ({
    onClick: (ev: { stopPropagation: () => void }) => {
      const ui = useUI.getState();
      if (ui.chapter !== 4 || !LAYER_OF[name]) return;
      ev.stopPropagation();
      ui.set({ layer: LAYER_OF[name] });
    },
    onPointerOver: (ev: { stopPropagation: () => void }) => {
      const ui = useUI.getState();
      if (ui.chapter !== 4 || !LAYER_OF[name]) return;
      ev.stopPropagation();
      ui.set({ hoverLayer: LAYER_OF[name] });
    },
    onPointerOut: () => {
      if (useUI.getState().hoverLayer) useUI.getState().set({ hoverLayer: null });
    },
  });

  const xs = L / 2 - T / 2;
  const xi = L / 2 - T - E / 2;
  const zg = D / 2 - T - E / 2;

  return (
    <group name="DS_Module">
      <group name="DS_Legs" ref={reg('DS_Legs')} {...pick('DS_Legs')}>
        {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <B key={`${sx}${sz}`} a={[0.08, Y0 + 0.01, 0.08]} p={[sx * 0.47, Y0 / 2, sz * 0.23]} m={MC.wood} r={0.012} />))}
      </group>

      <group name="DS_Frame" ref={reg('DS_Frame')} {...pick('DS_Frame')}>
        <B a={[L, T, D]} p={[0, Y0 + T / 2, 0]} m={MC.wood} />
        <B a={[L, HF, T]} p={[0, Y0 + HF / 2, D / 2 - T / 2]} m={MC.wood} />
        <B a={[L, HB, T]} p={[0, Y0 + HB / 2, -D / 2 + T / 2]} m={MC.wood} />
        <mesh geometry={g.frameSide} position={[xs, Y0, 0]} material={MC.wood} castShadow receiveShadow />
        <mesh geometry={g.frameSide} position={[-xs, Y0, 0]} material={MC.wood} castShadow receiveShadow />
      </group>

      <group name="DS_Insulation" ref={reg('DS_Insulation')} {...pick('DS_Insulation')}>
        <B a={[L - 2 * T, E, D - 2 * T]} p={[0, Y0 + T + E / 2, 0]} m={MC.eps} />
        <B a={[L - 2 * T, 0.085, E]} p={[0, Y0 + T + 0.0425, zg]} m={MC.eps} />
        <B a={[L - 2 * T, HB - T - 0.03, E]} p={[0, Y0 + T + (HB - T - 0.03) / 2, -zg]} m={MC.eps} />
        <mesh geometry={g.insSide} position={[xi, Y0 + T, 0]} material={MC.eps} castShadow />
        <mesh geometry={g.insSide} position={[-xi, Y0 + T, 0]} material={MC.eps} castShadow />
        <mesh geometry={g.shade} position={[-xi + E / 2 + 0.003, YB, 0]} material={own.shade} />
      </group>

      <group name="DS_Basin" ref={reg('DS_Basin')} {...pick('DS_Basin')}>
        <B a={[1.0, 0.006, 0.5]} p={[0, YB + 0.003, 0]} m={MC.ink} r={0.002} />
        <B a={[1.0, 0.045, 0.008]} p={[0, YB + 0.0225, 0.246]} m={MC.ink} r={0.003} />
        <B a={[1.0, 0.045, 0.008]} p={[0, YB + 0.0225, -0.246]} m={MC.ink} r={0.003} />
        <B a={[0.008, 0.045, 0.5]} p={[0.496, YB + 0.0225, 0]} m={MC.ink} r={0.003} />
        <B a={[0.008, 0.045, 0.5]} p={[-0.496, YB + 0.0225, 0]} m={MC.ink} r={0.003} />
      </group>

      <group name="DS_Water_Brine" ref={reg('DS_Water_Brine')} {...pick('DS_Water_Brine')}>
        <mesh ref={brineRef} geometry={g.brine} position={[0, YB + 0.006, 0]} material={own.brine} receiveShadow>
        </mesh>
        {SALT.map((s, i) => (
          <mesh key={i} ref={(m) => { salt.current[i] = m; }} position={[s.x, YB + 0.022, s.z]} rotation={[0.4, i, 0.3]} material={MC.white} scale={0.0001}>
            <octahedronGeometry args={[0.016, 0]} />
          </mesh>
        ))}
      </group>

      <group name="DS_Sensor_Temp" ref={reg('DS_Sensor_Temp')} {...pick('DS_Sensor_Temp')}>
        <Cy r={0.006} h={0.11} p={[-0.18, YB + 0.06, -0.12]} m={MC.alu} seg={10} />
        <mesh position={[-0.18, YB + 0.125, -0.12]} material={own.glow}>
          <sphereGeometry args={[0.016, 16, 12]} />
        </mesh>
      </group>

      <group name="DS_Gutter" ref={reg('DS_Gutter')} {...pick('DS_Gutter')}>
        <group position={[0, 0.158, zg]} rotation={[0, 0, 0.01]}>
          <B a={[1.02, 0.005, 0.03]} p={[0, 0, 0]} m={MC.steel} r={0.002} />
          <B a={[1.02, 0.022, 0.005]} p={[0, 0.011, 0.014]} m={MC.steel} r={0.002} />
          <B a={[1.02, 0.022, 0.005]} p={[0, 0.011, -0.014]} m={MC.steel} r={0.002} />
          <mesh ref={streamRef} position={[0, 0.008, 0]} material={own.stream} visible={false}>
            <boxGeometry args={[1.0, 0.01, 0.022]} />
          </mesh>
        </group>
      </group>

      <group name="DS_Glass" ref={reg('DS_Glass')} {...pick('DS_Glass')}>
        <group position={[0, Y0 + (HF + HB) / 2 + 0.006, 0]} rotation={[Math.atan(TAN), 0, 0]}>
          <mesh material={MC.glass} renderOrder={5}>
            <boxGeometry args={[L + 0.03, 0.01, D / Math.cos(Math.atan(TAN)) + 0.03]} />
          </mesh>
          {DROPS.map((d, i) => (
            <mesh key={i} name={`DS_Drop_0${i + 1}`} ref={(m) => { drops.current[i] = m; }} position={[d.x, -0.014, d.z]} material={MC.water}>
              <sphereGeometry args={[0.02, 14, 10]} />
            </mesh>
          ))}
        </group>
      </group>

      <group name="DS_Outlet" ref={reg('DS_Outlet')}>
        <Cy r={0.009} h={0.16} p={[-0.3, 0.165, D / 2 + 0.05]} rot={[Math.PI / 2, 0, 0]} m={MC.steel} seg={12} />
      </group>
      <group name="DS_Mineralizer" ref={reg('DS_Mineralizer')}>
        <Cy r={0.034} h={0.23} p={[-0.3, 0.125, D / 2 + 0.13]} m={MC.paper} />
        <Cy r={0.037} h={0.05} p={[-0.3, 0.13, D / 2 + 0.13]} m={MC.leaf} />
        <Cy r={0.007} h={0.2} p={[-0.4, 0.03, D / 2 + 0.13]} rot={[0, 0, Math.PI / 2]} m={MC.steel} seg={10} />
      </group>
      <group name="DS_Collector" ref={reg('DS_Collector')}>
        <RoundedBox args={[0.18, 0.25, 0.18]} radius={0.02} smoothness={3} position={[-0.5, 0.125, D / 2 + 0.14]} material={MC.glass} renderOrder={6} />
        <B a={[0.19, 0.016, 0.19]} p={[-0.5, 0.008, D / 2 + 0.14]} m={MC.paper} r={0.006} />
      </group>
      <group name="DS_Water_Fresh" ref={reg('DS_Water_Fresh')}>
        <mesh ref={fresh} geometry={g.fresh} position={[-0.5, 0.018, D / 2 + 0.14]} material={MC.water} />
      </group>
      <group name="DS_Sensor_Level" ref={reg('DS_Sensor_Level')} {...pick('DS_Sensor_Level')}>
        <B a={[0.08, 0.03, 0.05]} p={[-0.5, 0.266, D / 2 + 0.14]} m={MC.paper} r={0.008} />
        <mesh position={[-0.5, 0.286, D / 2 + 0.14]} material={own.glow}>
          <sphereGeometry args={[0.009, 12, 8]} />
        </mesh>
      </group>
      <group name="DS_Sensor_TDS" ref={reg('DS_Sensor_TDS')} {...pick('DS_Sensor_TDS')}>
        <Cy r={0.006} h={0.17} p={[-0.45, 0.18, D / 2 + 0.19]} m={MC.alu} seg={10} />
        <mesh position={[-0.45, 0.272, D / 2 + 0.19]} material={own.glow}>
          <sphereGeometry args={[0.011, 12, 8]} />
        </mesh>
      </group>

      <group name="DS_Electronics" ref={reg('DS_Electronics')} {...pick('DS_Electronics')}>
        <B a={[0.045, 0.09, 0.13]} p={[L / 2 + 0.022, 0.2, -0.05]} m={MC.ink} r={0.01} />
        <B a={[0.004, 0.036, 0.075]} p={[L / 2 + 0.046, 0.21, -0.05]} m={own.glow} r={0.001} />
      </group>
      <group name="DS_Antenna" ref={reg('DS_Antenna')} {...pick('DS_Antenna')}>
        <Cy r={0.004} h={0.12} p={[L / 2 + 0.022, 0.3, -0.1]} m={MC.ink} seg={8} />
        <mesh position={[L / 2 + 0.022, 0.365, -0.1]} material={MC.ink}>
          <sphereGeometry args={[0.009, 10, 8]} />
        </mesh>
      </group>
      <group name="DS_SolarPanel" ref={reg('DS_SolarPanel')}>
        <Cy r={0.011} h={0.56} p={[0.44, 0.28, -D / 2 - 0.1]} m={MC.alu} seg={10} />
        <group position={[0.44, 0.58, -D / 2 - 0.1]} rotation={[0.5, 0.35, 0]}>
          <B a={[0.36, 0.016, 0.26]} p={[0, 0, 0]} m={MC.ink} r={0.006} />
          <B a={[0.34, 0.004, 0.006]} p={[0, 0.009, 0]} m={MC.alu} r={0.001} />
          <B a={[0.006, 0.004, 0.24]} p={[-0.085, 0.009, 0]} m={MC.alu} r={0.001} />
          <B a={[0.006, 0.004, 0.24]} p={[0.085, 0.009, 0]} m={MC.alu} r={0.001} />
        </group>
      </group>

      {/* Efeitos do ciclo (cap. 3) */}
      <group name="DS_Vapor_Anchor" position={[0, YB + 0.03, 0]} />
      <points geometry={own.vg} material={own.vapor} renderOrder={4} />
      {[-0.17, -0.05, 0.07, 0.19].map((z, i) => (
        <mesh key={i} position={[-0.22 + (i % 2) * 0.12, 0.43, z - 0.08]} rotation={[-0.28, 0, 0]} material={own.ray}>
          <boxGeometry args={[0.01, 0.62, 0.01]} />
        </mesh>
      ))}

      {/* Rótulos numerados da vista explodida */}
      {chapter === 4 &&
        TAGS.map((tg, i) => {
          const on = layer === tg.key || hoverLayer === tg.key;
          const src = tg.key === 'DS_Sensors' ? 'DS_Electronics' : tg.key;
          const d = EXPLODE[src];
          return (
            <Html key={tg.key} position={[tg.p[0] + d[0], tg.p[1] + d[1], tg.p[2] + d[2]]} center zIndexRange={[5, 0]}>
              <button
                type="button"
                className={`tag3d${on ? ' is-on' : ''}`}
                aria-label={layers[i].title}
                onClick={() => useUI.getState().set({ layer: tg.key })}
              >
                {String(i + 1).padStart(2, '0')}
              </button>
            </Html>
          );
        })}
    </group>
  );
}

/** Versão enxuta para os quatro módulos do cap. 7. */
export function ModuleLite() {
  const side = useMemo(() => wedge(D, HF, HB, T), []);
  const xs = L / 2 - T / 2;
  return (
    <group>
      <B a={[L, T + Y0, D]} p={[0, (Y0 + T) / 2, 0]} m={M.wood} />
      <B a={[L, HF, T]} p={[0, Y0 + HF / 2, D / 2 - T / 2]} m={M.wood} />
      <B a={[L, HB, T]} p={[0, Y0 + HB / 2, -D / 2 + T / 2]} m={M.wood} />
      <mesh geometry={side} position={[xs, Y0, 0]} material={M.wood} castShadow />
      <mesh geometry={side} position={[-xs, Y0, 0]} material={M.wood} castShadow />
      <B a={[L - 2 * T, 0.06, D - 2 * T]} p={[0, YB, 0]} m={M.ink} r={0.003} />
      <B a={[1.0, 0.012, 0.5]} p={[0, YB + 0.036, 0]} m={M.brine} r={0.003} />
      <mesh position={[0, Y0 + (HF + HB) / 2 + 0.006, 0]} rotation={[Math.atan(TAN), 0, 0]} material={M.glass} renderOrder={5}>
        <boxGeometry args={[L + 0.03, 0.01, D / Math.cos(Math.atan(TAN)) + 0.03]} />
      </mesh>
      <RoundedBox args={[0.18, 0.25, 0.18]} radius={0.02} smoothness={3} position={[-0.5, 0.125, D / 2 + 0.14]} material={M.glass} renderOrder={6} />
      <B a={[0.155, 0.13, 0.155]} p={[-0.5, 0.08, D / 2 + 0.14]} m={M.water} r={0.01} />
    </group>
  );
}
