'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { live, near, remap, smooth, useUI } from '@/lib/state';
import { C, M, S } from './mats';
import { ModuleLite } from './Module';

/**
 * Placeholder da ilha do cerrado (docs/04_BLENDER_3D.md, seção 3).
 * Objetos com prefixo IS_; o GLB real substitui este arquivo.
 */
type V3 = [number, number, number];

function squircle(h: number, r: number) {
  const s = new THREE.Shape();
  s.moveTo(-h + r, -h);
  s.lineTo(h - r, -h);
  s.quadraticCurveTo(h, -h, h, -h + r);
  s.lineTo(h, h - r);
  s.quadraticCurveTo(h, h, h - r, h);
  s.lineTo(-h + r, h);
  s.quadraticCurveTo(-h, h, -h, h - r);
  s.lineTo(-h, -h + r);
  s.quadraticCurveTo(-h, -h, -h + r, -h);
  return s;
}
function slab(h: number, r: number, depth: number, bevel: number) {
  const g = new THREE.ExtrudeGeometry(squircle(h, r), {
    depth,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 4,
    curveSegments: 20,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -depth - bevel, 0);
  return g;
}

export const ROAD = new THREE.CatmullRomCurve3(
  [
    [-6.3, 4.4],
    [-4.2, 4.7],
    [-2.2, 3.7],
    [0.2, 4.0],
    [2.4, 4.8],
    [4.5, 4.0],
    [5.6, 2.0],
    [5.5, -0.2],
    [6.0, -2.2],
    [6.5, -3.5],
  ].map(([x, z]) => new THREE.Vector3(x, 0.03, z)),
);

function ribbon(curve: THREE.Curve<THREE.Vector3>, width: number, n = 120) {
  const pos: number[] = [];
  const idx: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= n; i++) {
    const p = curve.getPointAt(i / n);
    const tan = curve.getTangentAt(i / n);
    const side = new THREE.Vector3().crossVectors(up, tan).normalize().multiplyScalar(width / 2);
    pos.push(p.x - side.x, p.y, p.z - side.z, p.x + side.x, p.y, p.z + side.z);
    if (i < n) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function Tree({ p, s = 1, ipe = false }: { p: V3; s?: number; ipe?: boolean }) {
  const m = ipe ? M.sun2 : M.leaf;
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 0.45, 0]} material={M.wood} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 0.9, 8]} />
      </mesh>
      <mesh position={[0, 1.15, 0]} material={m} castShadow>
        <icosahedronGeometry args={[0.62, 2]} />
      </mesh>
      <mesh position={[0.36, 0.86, 0.18]} material={ipe ? m : M.leafDark} castShadow>
        <icosahedronGeometry args={[0.4, 2]} />
      </mesh>
      <mesh position={[-0.32, 0.92, -0.14]} material={m} castShadow>
        <icosahedronGeometry args={[0.36, 2]} />
      </mesh>
    </group>
  );
}

function House({ p, roof, rot = 0, name }: { p: V3; roof: THREE.Material; rot?: number; name: string }) {
  return (
    <group name={name} position={p} rotation={[0, rot, 0]}>
      <RoundedBox args={[1.5, 1.0, 1.2]} radius={0.08} smoothness={3} position={[0, 0.5, 0]} material={M.paper} castShadow receiveShadow />
      <mesh position={[0, 1.36, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1, 1, 0.82]} material={roof} castShadow>
        <coneGeometry args={[1.22, 0.8, 4]} />
      </mesh>
      <RoundedBox args={[0.3, 0.52, 0.06]} radius={0.02} position={[-0.3, 0.27, 0.61]} material={M.wood} />
      <RoundedBox args={[0.34, 0.3, 0.06]} radius={0.02} position={[0.32, 0.56, 0.61]} material={M.water} />
      <RoundedBox args={[0.06, 0.3, 0.34]} radius={0.02} position={[0.76, 0.56, 0]} material={M.water} />
    </group>
  );
}

function Sign({ p, rot, i }: { p: THREE.Vector3; rot: number; i: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const k = live.f < 5.5 ? 0 : live.f > 6.5 ? 1 : smooth(remap(live.local[6], 0.05 + i * 0.1, 0.16 + i * 0.1));
    const s = k * (1 + Math.sin(k * Math.PI) * 0.18);
    ref.current.scale.setScalar(s + 0.0001);
  });
  return (
    <group ref={ref} name={`IS_Sign_0${i + 1}`} position={p} rotation={[0, rot, 0]} scale={0.0001}>
      <mesh position={[0, 0.45, 0]} material={M.wood} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.9, 8]} />
      </mesh>
      <RoundedBox args={[0.78, 0.42, 0.07]} radius={0.03} position={[0, 0.92, 0]} material={M.paper} castShadow />
      <RoundedBox args={[0.5, 0.05, 0.02]} radius={0.008} position={[-0.06, 0.99, 0.04]} material={M.ink} />
      <RoundedBox args={[0.34, 0.05, 0.02]} radius={0.008} position={[-0.14, 0.88, 0.04]} material={i === 0 ? M.cerrado : M.sun2} />
    </group>
  );
}

const SLOTS: V3[] = [
  [0, 0, -2.0],
  [2.9, 0, 0.3],
  [2.9, 0, -2.0],
];

export default function Island() {
  const geo = useMemo(
    () => ({
      top: slab(6.6, 3, 0.35, 0.12),
      mid: slab(6.45, 2.9, 0.75, 0.14),
      low: slab(5.7, 2.6, 0.7, 0.18),
      base: slab(4.5, 2.2, 0.5, 0.2),
      road: ribbon(ROAD, 0.95),
      roadLine: ribbon(ROAD, 0.08),
      fill: new THREE.CylinderGeometry(0.72, 0.72, 1.64, 28).translate(0, 0.82, 0),
    }),
    [],
  );
  const signs = useMemo(
    () =>
      [0.13, 0.32, 0.5, 0.66].map((t) => {
        const p = ROAD.getPointAt(t);
        const tan = ROAD.getTangentAt(t);
        const n = new THREE.Vector3(-tan.z, 0, tan.x).multiplyScalar(-0.85);
        return { p: new THREE.Vector3(p.x + n.x, 0, p.z + n.z), rot: Math.atan2(tan.x, tan.z) - Math.PI / 2 + 0.5 };
      }),
    [],
  );

  const bike = useRef<THREE.Group>(null);
  const drone = useRef<THREE.Group>(null);
  const rotors = useRef<THREE.Group>(null);
  const trophy = useRef<THREE.Group>(null);
  const medal = useRef<THREE.Group>(null);
  const fill = useRef<THREE.Mesh>(null);
  const slots = useRef<(THREE.Group | null)[]>([]);
  const lab = useRef<THREE.Group>(null);
  const papers = useRef<(THREE.Group | null)[]>([]);
  const crystals = useRef<(THREE.Mesh | null)[]>([]);
  const dropsRef = useRef<(THREE.Mesh | null)[]>([]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = live.snap ? 0 : state.clock.elapsedTime;
    const ui = useUI.getState();

    // Peças que se movem sozinhas
    if (bike.current) {
      const u = (Math.sin(t * 0.09) * 0.5 + 0.5) * 0.9 + 0.05;
      ROAD.getPointAt(u, bike.current.position);
      ROAD.getTangentAt(u, tmp);
      const dir = Math.cos(t * 0.09) >= 0 ? 1 : -1;
      bike.current.rotation.y = Math.atan2(tmp.x * dir, tmp.z * dir);
    }
    if (drone.current) {
      drone.current.position.set(Math.cos(t * 0.35) * 4.6 - 0.5, 4.4 + Math.sin(t * 1.3) * 0.18, Math.sin(t * 0.35) * 3.4 - 1.2);
      drone.current.rotation.y = -t * 0.35;
    }
    if (rotors.current) rotors.current.children.forEach((c) => (c.rotation.y = t * 30));

    // Cap. 1 — cristais de sal em suspensão sobre o poço
    const k1 = near(1, 0.2, 0.8);
    crystals.current.forEach((m, i) => {
      if (!m) return;
      const on = ui.crystal === i ? 1 : 0;
      m.rotation.y = t * (0.5 + i * 0.15) + i;
      m.rotation.x = t * 0.3 + i * 2;
      m.position.y = 2.0 + i * 0.28 + Math.sin(t * 1.1 + i * 2) * 0.12;
      const target = k1 * (1 + on * 0.5) + 0.0001;
      m.scale.setScalar(m.scale.x + (target - m.scale.x) * 0.15);
    });

    // Cap. 2 — mesa de laboratório e papéis que se dobram
    const k2 = near(2, 0.15, 0.8);
    if (lab.current) {
      lab.current.visible = k2 > 0.01;
      lab.current.position.y = -2.3 - (1 - k2) * 5;
    }
    papers.current.forEach((g, i) => {
      if (g) g.rotation.z = smooth(remap(live.local[2], 0.3 + i * 0.13, 0.46 + i * 0.13)) * -Math.PI * 0.93;
    });

    // Cap. 6 — troféu e medalha
    const pop = (g: THREE.Group | null, a: number) => {
      if (!g) return;
      const k = live.f < 5.5 ? 0 : live.f > 6.5 ? 1 : smooth(remap(live.local[6], a, a + 0.12));
      g.scale.setScalar(k * (1 + Math.sin(k * Math.PI) * 0.25) + 0.0001);
      g.rotation.y = t * 0.6;
      g.position.y = 0.05 + Math.sin(t * 1.4 + a * 9) * 0.06 * k;
    };
    pop(trophy.current, 0.52);
    pop(medal.current, 0.66);

    // Cap. 7 — quatro módulos e a caixa d'água enchendo até a meta
    const k7 = live.f < 6.4 ? 0 : live.f > 7.6 ? 1 : live.f < 7 ? smooth(remap(live.f, 6.5, 7)) : 1;
    slots.current.forEach((g, i) => {
      if (!g) return;
      const s = live.f > 7.5 ? 1 : k7 * smooth(remap(live.local[7], 0.1 + i * 0.1, 0.24 + i * 0.1));
      g.scale.setScalar((s * (1 + Math.sin(s * Math.PI) * 0.12) + 0.0001) * S);
      g.visible = s > 0.001;
    });
    const lvl = live.f > 7.5 ? 1 : k7 * smooth(remap(live.local[7], 0.35, 0.85));
    if (fill.current) fill.current.scale.y = 0.08 + lvl * 0.9;
    dropsRef.current.forEach((m, i) => {
      if (!m) return;
      const on = lvl > 0.02 && lvl < 0.98 && Math.abs(live.f - 7) < 0.4;
      m.visible = on;
      const u = (t * 0.9 + i * 0.25) % 1;
      m.position.y = 4.9 - u * 1.6;
      m.scale.setScalar(0.6 + (1 - u) * 0.5);
    });
  });

  const TROPHY = ROAD.getPointAt(0.8);
  const MEDAL = ROAD.getPointAt(0.93);

  return (
    <group name="IS_Island">
      <group name="IS_Ground">
        <mesh geometry={geo.top} material={M.grass} receiveShadow />
        <mesh geometry={geo.mid} position={[0, -0.47, 0]} material={M.cerrado} receiveShadow castShadow />
        <mesh geometry={geo.low} position={[0.1, -1.36, 0.1]} material={M.cerradoDark} />
        <mesh geometry={geo.base} position={[-0.15, -2.24, 0.2]} material={M.cerrado} />
      </group>

      <group name="IS_Road">
        <mesh geometry={geo.road} material={M.road} receiveShadow />
        <mesh geometry={geo.roadLine} position={[0, 0.006, 0]} material={M.cerrado} />
      </group>
      {signs.map((s, i) => (
        <Sign key={i} p={s.p} rot={s.rot} i={i} />
      ))}

      {/* Base do módulo principal */}
      <RoundedBox name="IS_Module_Slot" args={[3.1, 0.1, 2.3]} radius={0.045} smoothness={3} position={[-0.15, 0.03, 0.5]} material={M.paper2} receiveShadow />
      {SLOTS.map((p, i) => (
        <group key={i} name={`IS_Module_Slot_${i + 2}`} position={p} ref={(g) => { slots.current[i] = g; }} scale={0.0001} visible={false}>
          <ModuleLite />
        </group>
      ))}

      <group name="IS_Well" position={[-4.3, 0, 1.9]}>
        <mesh position={[0, 0.3, 0]} material={M.paper} castShadow receiveShadow>
          <cylinderGeometry args={[0.72, 0.78, 0.6, 28]} />
        </mesh>
        <mesh position={[0, 0.605, 0]} material={M.ink}>
          <cylinderGeometry args={[0.58, 0.58, 0.02, 28]} />
        </mesh>
        <mesh position={[0, 0.6, 0]} material={M.brine}>
          <cylinderGeometry args={[0.55, 0.55, 0.05, 28]} />
        </mesh>
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.66, 0.95, 0]} material={M.wood} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 1.5, 8]} />
          </mesh>
        ))}
        <mesh position={[0, 1.66, 0]} rotation={[0, 0, Math.PI / 2]} material={M.wood} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1.6, 8]} />
        </mesh>
        <mesh position={[0, 1.3, 0]} material={M.ink}>
          <cylinderGeometry args={[0.012, 0.012, 0.7, 6]} />
        </mesh>
        <mesh position={[0, 0.95, 0]} material={M.alu} castShadow>
          <cylinderGeometry args={[0.15, 0.11, 0.24, 14]} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            ref={(m) => { crystals.current[i] = m; }}
            position={[[-0.75, 0.05, 0.8][i], 2, [0.35, -0.2, 0.5][i]]}
            material={M.brine2}
            scale={0.0001}
            castShadow
            onPointerOver={(e) => { e.stopPropagation(); useUI.getState().set({ crystal: i }); }}
            onPointerOut={() => useUI.getState().set({ crystal: null })}
          >
            <octahedronGeometry args={[0.3, 0]} />
          </mesh>
        ))}
      </group>

      <group name="IS_WaterTower" position={[-4.4, 0, -3.4]}>
        {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.5, 1.15, sz * 0.5]} material={M.wood} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 2.3, 8]} />
          </mesh>
        )))}
        <RoundedBox args={[1.5, 0.12, 1.5]} radius={0.05} position={[0, 2.32, 0]} material={M.wood} castShadow />
        <mesh position={[0, 3.2, 0]} material={M.glass} renderOrder={6}>
          <cylinderGeometry args={[0.78, 0.78, 1.7, 28]} />
        </mesh>
        <mesh name="IS_WaterTower_Fill" ref={fill} geometry={geo.fill} position={[0, 2.4, 0]} material={M.water} scale={[1, 0.08, 1]} />
        <mesh position={[0, 4.1, 0]} material={M.paper} castShadow>
          <cylinderGeometry args={[0.2, 0.86, 0.3, 28]} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} ref={(m) => { dropsRef.current[i] = m; }} position={[(i % 2) * 0.3 - 0.15, 4.6, ((i >> 1) % 2) * 0.3 - 0.15]} material={M.water} visible={false}>
            <sphereGeometry args={[0.09, 12, 10]} />
          </mesh>
        ))}
      </group>

      <House name="IS_House_01" p={[-1.9, 0, -4.9]} roof={M.brine} rot={0.15} />
      <House name="IS_House_02" p={[1.1, 0, -5.1]} roof={M.sun2} rot={-0.1} />
      <House name="IS_House_03" p={[4.6, 0, -4.7]} roof={M.paper2} rot={-0.5} />
      <House name="IS_House_04" p={[-5.1, 0, -0.7]} roof={M.brine} rot={0.9} />

      <Tree p={[-3.4, 0, -5.4]} s={1.05} />
      <Tree p={[-0.4, 0, -5.8]} s={0.85} />
      <Tree p={[2.9, 0, -5.5]} s={1.1} />
      <Tree p={[5.6, 0, -2.9]} s={0.8} />
      <Tree p={[-5.8, 0, -2.7]} s={0.95} />
      <Tree p={[-3.0, 0, -3.7]} s={0.9} />
      <Tree p={[-2.9, 0, -1.6]} s={1.15} ipe />
      <Tree p={[-2.8, 0, 1.4]} s={0.8} />
      <Tree p={[-1.0, 0, 5.6]} s={0.9} />
      <Tree p={[1.4, 0, 5.8]} s={1.0} ipe />
      <Tree p={[3.9, 0, 5.5]} s={0.8} />
      <Tree p={[5.6, 0, 4.2]} s={0.7} />
      <Tree p={[-5.3, 0, 5.2]} s={0.75} />
      <Tree p={[4.6, 0, 2.2]} s={0.6} />
      {[[-3.6, 3.0], [1.6, 2.7], [-1.6, -3.4], [5.9, 0.9], [-5.9, 3.0], [3.3, -3.9]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.14, z]} scale={[1, 0.7, 1]} material={i % 2 ? M.leafDark : M.cerrado} castShadow>
          <icosahedronGeometry args={[0.24 + (i % 3) * 0.06, 1]} />
        </mesh>
      ))}

      <group name="IS_Trophy" ref={trophy} position={[TROPHY.x - 0.95, 0.05, TROPHY.z + 0.1]} scale={0.0001}>
        <RoundedBox args={[0.6, 0.16, 0.6]} radius={0.04} position={[0, 0.08, 0]} material={M.ink} castShadow />
        <mesh position={[0, 0.34, 0]} material={M.sun2} castShadow>
          <cylinderGeometry args={[0.07, 0.16, 0.38, 16]} />
        </mesh>
        <mesh position={[0, 0.78, 0]} material={M.sun2} castShadow>
          <cylinderGeometry args={[0.36, 0.14, 0.56, 24]} />
        </mesh>
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.36, 0.82, 0]} material={M.sun2}>
            <torusGeometry args={[0.15, 0.035, 8, 18]} />
          </mesh>
        ))}
      </group>
      <group name="IS_Medal" ref={medal} position={[MEDAL.x - 1.05, 0.05, MEDAL.z + 0.5]} scale={0.0001}>
        <RoundedBox args={[0.13, 0.62, 0.04]} radius={0.015} position={[-0.11, 1.1, 0]} rotation={[0, 0, -0.3]} material={M.brine} />
        <RoundedBox args={[0.13, 0.62, 0.04]} radius={0.015} position={[0.11, 1.1, 0]} rotation={[0, 0, 0.3]} material={M.brine} />
        <mesh position={[0, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.water} castShadow>
          <cylinderGeometry args={[0.36, 0.36, 0.08, 28]} />
        </mesh>
        <mesh position={[0, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.paper}>
          <cylinderGeometry args={[0.22, 0.22, 0.1, 24]} />
        </mesh>
      </group>

      <group name="IS_Bike" ref={bike}>
        {[-0.22, 0.22].map((z) => (
          <mesh key={z} position={[0, 0.16, z]} rotation={[0, Math.PI / 2, 0]} material={M.ink} castShadow>
            <torusGeometry args={[0.13, 0.03, 8, 16]} />
          </mesh>
        ))}
        <RoundedBox args={[0.05, 0.05, 0.46]} radius={0.02} position={[0, 0.27, 0]} material={M.brine} />
        <mesh position={[0, 0.52, -0.05]} material={M.paper} castShadow>
          <capsuleGeometry args={[0.08, 0.2, 4, 10]} />
        </mesh>
        <mesh position={[0, 0.76, -0.05]} material={M.sun2}>
          <sphereGeometry args={[0.08, 12, 10]} />
        </mesh>
      </group>
      <group name="IS_Drone" ref={drone}>
        <RoundedBox args={[0.34, 0.1, 0.22]} radius={0.04} material={M.paper} castShadow />
        <mesh position={[0, -0.07, 0.08]} material={M.water}>
          <sphereGeometry args={[0.05, 10, 8]} />
        </mesh>
        <group ref={rotors}>
          {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
            <mesh key={`${sx}${sz}`} position={[sx * 0.24, 0.07, sz * 0.2]} scale={[1, 0.08, 0.25]} material={M.ink}>
              <sphereGeometry args={[0.14, 10, 6]} />
            </mesh>
          )))}
        </group>
      </group>

      <group name="IS_LabTable" ref={lab} position={[0, -7, 0]} visible={false}>
        <RoundedBox args={[40, 0.7, 34]} radius={0.3} smoothness={4} position={[2, -0.6, 3]} material={M.table} receiveShadow />
        {[C.brine, C.water, C.sun].map((col, i) => (
          <group key={i} position={[-5.5 + i * 5.6, -0.22, 11.2 + (i % 2) * 0.5]} rotation={[0, 0.25 - i * 0.22, 0]}>
            <RoundedBox args={[1.9, 0.03, 2.7]} radius={0.012} position={[0.95, 0, 0]} material={M.white} receiveShadow />
            <RoundedBox args={[1.4, 0.034, 0.32]} radius={0.012} position={[0.95, 0.002, -0.9]}>
              <meshStandardMaterial color={col} roughness={0.7} />
            </RoundedBox>
            <RoundedBox args={[1.2, 0.034, 0.07]} radius={0.01} position={[0.85, 0.002, -0.3]} material={M.eps} />
            <RoundedBox args={[1.0, 0.034, 0.07]} radius={0.01} position={[0.75, 0.002, 0.0]} material={M.eps} />
            <group ref={(g) => { papers.current[i] = g; }}>
              <RoundedBox args={[1.9, 0.03, 2.7]} radius={0.012} position={[-0.95, 0.001, 0]} material={M.white} castShadow receiveShadow />
            </group>
          </group>
        ))}
        <mesh position={[9.5, -0.12, 8]} rotation={[0, 0.6, Math.PI / 2]} material={M.sun2} castShadow>
          <cylinderGeometry args={[0.13, 0.13, 3.4, 6]} />
        </mesh>
        <mesh position={[-10.5, -0.1, 5.5]} material={M.paper} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.3, 28]} />
        </mesh>
      </group>
    </group>
  );
}
