'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import { live, near, remap, smooth, useUI } from '@/lib/state';
import { layers } from '@/lib/content';
import { C, M, MC, S, clipPlane } from './mats';

/**
 * Módulo DeSol modelado no Blender (blender/build_desol.py → public/models/desol-module.glb).
 * O código acha as peças pelo nome (DS_*) para explodir camadas, cortar, acender
 * sensores e animar o ciclo. Vapor, raios, sal e o filete da calha são feitos aqui.
 */
export const MODULE_URL = '/models/desol-module.glb';
export const DRACO = '/draco/';

const L = 1.14;
const D = 0.64;
const HF = 0.15;
const TAN = Math.tan((18 * Math.PI) / 180);
const HB = HF + TAN * D;
const Y0 = 0.05;
const T = 0.02;
const E = 0.04;
const YB = Y0 + T + E;

type V3 = [number, number, number];
type Mats = typeof M;

/** Troca os materiais do GLB (M_*) pelos do site e liga sombras. */
export function dress(root: THREE.Object3D, mats: Mats, over: Record<string, THREE.Material> = {}) {
  const missing = new Set<string>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const raw = (mesh.material as THREE.Material).name.replace(/^M_/, '').replace(/\.\d+$/, '');
    const key = (raw === 'sunSoft' ? 'sun2' : raw) as keyof Mats;
    const m = over[raw] ?? mats[key];
    if (m) mesh.material = m;
    else missing.add(raw);
    const glass = raw === 'glass';
    mesh.castShadow = !glass;
    mesh.receiveShadow = !glass;
    if (glass) mesh.renderOrder = 5;
  });
  if (missing.size && process.env.NODE_ENV !== 'production') console.warn('[DeSol] materiais sem par no site:', [...missing]);
  return root;
}

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

/** Cap. 3 — rótulos de fluxo sobre o corte; cada um aparece a partir do seu passo. */
const FLOW: { text: string; p: V3; from: number; tone: string }[] = [
  { text: 'Vapor sobe ↑', p: [0.2, 0.25, -0.02], from: 2, tone: '' },
  { text: 'Sal fica na bacia', p: [0.2, YB - 0.05, 0.14], from: 2, tone: 'brine' },
  { text: '← Destilado sai', p: [0.2, 0.2, 0.36], from: 4, tone: 'water' },
  { text: 'Água salobra entra', p: [0.2, YB - 0.05, -0.14], from: 0, tone: 'brine' },
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

const SALT = Array.from({ length: 7 }, (_, k) => ({
  x: -0.44 + ((k * 0.43) % 1) * 0.5,
  z: -0.2 + ((k * 0.71) % 1) * 0.4,
}));

export default function Module() {
  const gltf = useGLTF(MODULE_URL, DRACO);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const chapter = useUI((s) => s.chapter);
  const layer = useUI((s) => s.layer);
  const hoverLayer = useUI((s) => s.hoverLayer);
  const step = useUI((s) => s.step);

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
      pos[i * 3] = -0.47 + ((i * 0.618034) % 1) * 0.55;
      pos[i * 3 + 1] = 0.14;
      pos[i * 3 + 2] = -0.21 + ((i * 0.754877) % 1) * 0.42;
      seed[i] = (i * 0.3819) % 1;
    }
    vg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    vg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    vg.boundingSphere = new THREE.Sphere(new THREE.Vector3(-0.2, 0.25, 0), 1);
    return {
      brine, shade, ray, glow, stream, vapor, vg,
      shadeGeo: wedge(D - 2 * T - 2 * E, 0.07, HB - T - E - 0.03, 0.002),
      cBrine: new THREE.Color(C.brine), cHot: new THREE.Color('#FF8A2B'),
    };
  }, []);

  // peças do GLB, com a posição de repouso guardada
  const model = useMemo(() => {
    const root = gltf.scene.clone(true);
    dress(root, MC, { sun: own.glow, brine: own.brine });
    const parts: Record<string, { o: THREE.Object3D; base: THREE.Vector3; mats: { m: THREE.Material; op: number; tr: boolean }[] }> = {};
    const absent: string[] = [];
    ORDER.forEach((n) => {
      const o = root.getObjectByName(n);
      if (!o) return void absent.push(n);
      // material próprio por peça, para esmaecer as outras quando uma camada é escolhida
      const mats: { m: THREE.Material; op: number; tr: boolean }[] = [];
      o.traverse((c) => {
        const mesh = c as THREE.Mesh;
        const src = mesh.material as THREE.Material;
        // glow e brine são animados por referência no ciclo: ficam compartilhados
        if (!mesh.isMesh || src === own.glow || src === own.brine) return;
        const m = src.clone();
        mesh.material = m;
        mats.push({ m, op: m.opacity, tr: m.transparent });
      });
      parts[n] = { o, base: o.position.clone(), mats };
    });
    const drops: { o: THREE.Object3D; z0: number }[] = [];
    root.traverse((o) => {
      if (o.name.startsWith('DS_Drop_')) drops.push({ o, z0: o.position.z });
    });
    if (absent.length && process.env.NODE_ENV !== 'production') console.warn('[DeSol] objetos ausentes no GLB do módulo:', absent);
    return { root, parts, drops, brine: root.getObjectByName('DS_Water_Brine'), fresh: root.getObjectByName('DS_Water_Fresh') };
  }, [gltf, own]);

  const salt = useRef<(THREE.Mesh | null)[]>([]);
  const streamRef = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    const t = live.snap ? 0 : state.clock.elapsedTime;
    const k = live.snap ? 1 : 1 - Math.exp(-dt * 9);
    const ui = useUI.getState();

    // Cap. 4 — vista explodida com mola suave e leve escalonamento por peça
    const e = near(4, 0.35, 0.95);
    ORDER.forEach((name, idx) => {
      const part = model.parts[name];
      if (!part) return;
      const d = EXPLODE[name];
      const ek = smooth(remap(e, idx * 0.02, 0.62 + idx * 0.02));
      const sel = e > 0.5 && ui.layer && LAYER_OF[name] === ui.layer ? 1 : 0;
      const hov = e > 0.5 && ui.hoverLayer && LAYER_OF[name] === ui.hoverLayer ? 1 : 0;
      const p = part.o.position;
      p.x += (part.base.x + d[0] * ek + sel * 0.1 - p.x) * k;
      p.y += (part.base.y + d[1] * ek + hov * 0.015 - p.y) * k;
      p.z += (part.base.z + d[2] * ek + sel * 0.1 - p.z) * k;
      const dim = e > 0.5 && ui.layer && !sel;
      part.mats.forEach(({ m, op, tr }) => {
        m.opacity += ((dim ? op * 0.16 : op) - m.opacity) * k;
        m.transparent = tr || m.opacity < op - 0.01;
      });
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
    if (model.brine) model.brine.scale.y = 1 - smooth(remap(p, 0.3, 0.9)) * 0.45 * cut;
    own.vapor.uniforms.uTime.value = t;
    own.vapor.uniforms.uAmt.value = cut * evap * (1 - smooth(remap(p, 0.92, 1)) * 0.4);
    own.vapor.uniforms.uSize.value = (0.042 * S * size.height * dpr) / 0.4986;
    salt.current.forEach((m, i) => {
      if (m) m.scale.setScalar(cut * smooth(remap(p, 0.34 + i * 0.03, 0.5 + i * 0.03)) + 0.0001);
    });
    model.drops.forEach(({ o, z0 }, i) => {
      const a = smooth(remap(p, 0.48 + i * 0.012, 0.6 + i * 0.012));
      const sl = smooth(remap(p, 0.64 + i * 0.014, 0.8 + i * 0.014));
      o.position.z = z0 + (0.3 - z0) * sl;
      const s = cut > 0.01 ? a * (1 - smooth(remap(sl, 0.9, 1))) : 0.45 + 0.1 * Math.sin(i * 2.1);
      o.scale.set(s + 0.0001, s * 0.6 + 0.0001, s * (1 + sl * (1 - sl) * 2.4) + 0.0001);
    });
    if (streamRef.current) {
      const fl = cut * smooth(remap(p, 0.72, 0.84));
      streamRef.current.scale.x = fl + 0.0001;
      streamRef.current.visible = fl > 0.01;
    }
    if (model.fresh) model.fresh.scale.y = cut > 0.01 ? 0.12 + fill * 0.75 : 0.55;

    // Cap. 5 — sensores acendem
    const dig = near(5, 0.3, 0.9);
    own.glow.emissiveIntensity = 1.2 + dig * (2.4 + Math.sin(t * 5) * 1.2);
  });

  /** Sobe na hierarquia até achar a peça nomeada que representa uma camada. */
  const layerOf = (o: THREE.Object3D | null) => {
    for (let n = o; n; n = n.parent) if (LAYER_OF[n.name]) return LAYER_OF[n.name];
    return null;
  };
  const onClick = (ev: ThreeEvent<MouseEvent>) => {
    const ui = useUI.getState();
    const l = ui.chapter === 4 ? layerOf(ev.object) : null;
    if (!l) return;
    ev.stopPropagation();
    ui.set({ layer: l });
  };
  const onOver = (ev: ThreeEvent<PointerEvent>) => {
    const ui = useUI.getState();
    const l = ui.chapter === 4 ? layerOf(ev.object) : null;
    if (!l) return;
    ev.stopPropagation();
    if (ui.hoverLayer !== l) ui.set({ hoverLayer: l });
  };
  const onOut = () => {
    if (useUI.getState().hoverLayer) useUI.getState().set({ hoverLayer: null });
  };

  const xi = L / 2 - T - E / 2;
  const zg = D / 2 - T - E / 2;

  return (
    <group name="DS_Module">
      <primitive object={model.root} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut} />

      {/* Efeitos do ciclo (cap. 3), no mesmo referencial do modelo */}
      <mesh geometry={own.shadeGeo} position={[-xi + E / 2 + 0.003, YB, 0]} material={own.shade} />
      {SALT.map((s, i) => (
        <mesh key={i} ref={(m) => { salt.current[i] = m; }} position={[s.x, YB + 0.022, s.z]} rotation={[0.4, i, 0.3]} material={MC.white} scale={0.0001}>
          <octahedronGeometry args={[0.016, 0]} />
        </mesh>
      ))}
      <mesh ref={streamRef} position={[0, 0.167, zg]} material={own.stream} visible={false}>
        <boxGeometry args={[1.0, 0.01, 0.02]} />
      </mesh>
      <points geometry={own.vg} material={own.vapor} renderOrder={4} />
      {[-0.17, -0.05, 0.07, 0.19].map((z, i) => (
        <mesh key={i} position={[-0.22 + (i % 2) * 0.12, 0.43, z - 0.08]} rotation={[-0.28, 0, 0]} material={own.ray}>
          <boxGeometry args={[0.01, 0.62, 0.01]} />
        </mesh>
      ))}

      {chapter === 3 &&
        FLOW.map((f) => (
          <Html key={f.text} position={f.p} center zIndexRange={[5, 0]}>
            <span className={`flow3d${step >= f.from ? ' is-on' : ''}`} data-tone={f.tone}>
              {f.text}
            </span>
          </Html>
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

const LITE = ['DS_Legs', 'DS_Frame', 'DS_Insulation', 'DS_Basin', 'DS_Water_Brine', 'DS_Gutter', 'DS_Glass', 'DS_Collector', 'DS_Water_Fresh'];

/** Cópia enxuta do mesmo GLB para os quatro módulos do cap. 7. */
export function ModuleLite() {
  const gltf = useGLTF(MODULE_URL, DRACO);
  const root = useMemo(() => {
    const r = dress(gltf.scene.clone(true), M);
    r.children.forEach((c) => {
      c.visible = LITE.includes(c.name);
    });
    r.traverse((o) => {
      if (o.name.startsWith('DS_Drop_')) o.visible = false;
      if (o.name === 'DS_Water_Fresh') o.scale.y = 0.6;
    });
    return r;
  }, [gltf]);
  return <primitive object={root} />;
}

useGLTF.preload(MODULE_URL, DRACO);
