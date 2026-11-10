'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, useGLTF } from '@react-three/drei';
import { live, near, remap, smooth, useUI } from '@/lib/state';
import { C, M, S } from './mats';
import { DRACO, ModuleLite, dress } from './Module';

/**
 * Ilha do cerrado modelada no Blender (blender/build_desol.py → public/models/desol-island.glb).
 * O código acha pelo nome (IS_*) o que se move: placas, troféu, medalha, bicicleta,
 * drone, nível da caixa d'água e mesa de laboratório. Cristais de sal, papéis que
 * se dobram e gotas são feitos aqui.
 */
export const ISLAND_URL = '/models/desol-island.glb';
type V3 = [number, number, number];

/** Mesmo traçado de blender/road.json — a bicicleta anda sobre ele. */
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

const WELL: V3 = [-4.3, 0, 1.9];
const TOWER: V3 = [-4.4, 0, -3.4];
const SLOT_FALLBACK: V3[] = [
  [0, 0, -2.0],
  [2.9, 0, 0.3],
  [2.9, 0, -2.0],
];

export default function Island() {
  const gltf = useGLTF(ISLAND_URL, DRACO);

  // objetos do GLB que o código anima, achados pelo nome
  const isl = useMemo(() => {
    const root = dress(gltf.scene.clone(true), M);
    const names = ['IS_Bike', 'IS_Drone', 'IS_Trophy', 'IS_Medal', 'IS_WaterTower_Fill', 'IS_LabTable', 'IS_Sign_01', 'IS_Sign_02', 'IS_Sign_03', 'IS_Sign_04'] as const;
    const got = {} as Record<(typeof names)[number], THREE.Object3D | undefined>;
    names.forEach((n) => (got[n] = root.getObjectByName(n)));
    const absent = names.filter((n) => !got[n]);
    if (absent.length && process.env.NODE_ENV !== 'production') console.warn('[DeSol] objetos ausentes no GLB da ilha:', absent);
    const rotors: THREE.Object3D[] = [];
    root.traverse((o) => {
      if (o.name.startsWith('IS_Drone_Rotor')) rotors.push(o);
    });
    const signs = [got.IS_Sign_01, got.IS_Sign_02, got.IS_Sign_03, got.IS_Sign_04];
    [got.IS_Trophy, got.IS_Medal, ...signs].forEach((o) => o?.scale.setScalar(0.0001));
    if (got.IS_LabTable) got.IS_LabTable.visible = false;
    const slots = [2, 3, 4].map((n, i) => (root.getObjectByName(`IS_Module_Slot_${n}`)?.position.toArray() as V3 | undefined) ?? SLOT_FALLBACK[i]);
    return { root, rotors, slots, signs, got };
  }, [gltf]);

  const slots = useRef<(THREE.Group | null)[]>([]);
  const papersGrp = useRef<THREE.Group>(null);
  const papers = useRef<(THREE.Group | null)[]>([]);
  const crystals = useRef<(THREE.Mesh | null)[]>([]);
  const dropsRef = useRef<(THREE.Mesh | null)[]>([]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = live.snap ? 0 : state.clock.elapsedTime;
    const ui = useUI.getState();
    const { got } = isl;

    // Peças que se movem sozinhas
    if (got.IS_Bike) {
      const u = (Math.sin(t * 0.09) * 0.5 + 0.5) * 0.9 + 0.05;
      ROAD.getPointAt(u, got.IS_Bike.position);
      ROAD.getTangentAt(u, tmp);
      const dir = Math.cos(t * 0.09) >= 0 ? 1 : -1;
      got.IS_Bike.rotation.set(0, Math.atan2(tmp.x * dir, tmp.z * dir), 0);
    }
    if (got.IS_Drone) {
      got.IS_Drone.position.set(Math.cos(t * 0.35) * 4.6 - 0.5, 4.4 + Math.sin(t * 1.3) * 0.18, Math.sin(t * 0.35) * 3.4 - 1.2);
      got.IS_Drone.rotation.set(0, -t * 0.35, 0);
    }
    isl.rotors.forEach((r, i) => r.rotation.set(0, t * 30 + i, 0));

    // Cap. 1 — cristais de sal em suspensão sobre o poço
    const k1 = near(1, 0.2, 0.8);
    crystals.current.forEach((m, i) => {
      if (!m) return;
      const on = ui.crystal === i ? 1 : 0;
      m.rotation.y = t * (0.5 + i * 0.15) + i;
      m.rotation.x = t * 0.3 + i * 2;
      m.position.y = 2.35 + i * 0.28 + Math.sin(t * 1.1 + i * 2) * 0.12;
      const target = k1 * (1 + on * 0.5) + 0.0001;
      m.scale.setScalar(m.scale.x + (target - m.scale.x) * 0.15);
    });

    // Cap. 2 — mesa de laboratório e papéis que se dobram
    const k2 = near(2, 0.15, 0.8);
    const labY = -2.3 - (1 - k2) * 5;
    if (got.IS_LabTable) {
      got.IS_LabTable.visible = k2 > 0.01;
      got.IS_LabTable.position.y = labY;
    }
    if (papersGrp.current) {
      papersGrp.current.visible = k2 > 0.01;
      papersGrp.current.position.y = labY;
    }
    papers.current.forEach((g, i) => {
      if (g) g.rotation.z = smooth(remap(live.local[2], 0.3 + i * 0.13, 0.46 + i * 0.13)) * -Math.PI * 0.93;
    });

    // Cap. 6 — placas, troféu e medalha surgem ao longo da estrada
    const seen = live.f < 5.5 ? 0 : live.f > 6.5 ? 1 : -1;
    isl.signs.forEach((o, i) => {
      if (!o) return;
      const k = seen >= 0 ? seen : smooth(remap(live.local[6], 0.05 + i * 0.1, 0.16 + i * 0.1));
      o.scale.setScalar(k * (1 + Math.sin(k * Math.PI) * 0.18) + 0.0001);
    });
    const pop = (o: THREE.Object3D | undefined, a: number) => {
      if (!o) return;
      const k = seen >= 0 ? seen : smooth(remap(live.local[6], a, a + 0.12));
      o.scale.setScalar(k * (1 + Math.sin(k * Math.PI) * 0.25) + 0.0001);
      o.rotation.set(0, t * 0.6, 0);
      o.position.y = 0.05 + Math.sin(t * 1.4 + a * 9) * 0.06 * k;
    };
    pop(got.IS_Trophy, 0.52);
    pop(got.IS_Medal, 0.66);

    // Cap. 7 — quatro módulos e a caixa d'água enchendo até a meta
    const k7 = live.f < 6.4 ? 0 : live.f > 7.6 ? 1 : live.f < 7 ? smooth(remap(live.f, 6.5, 7)) : 1;
    slots.current.forEach((g, i) => {
      if (!g) return;
      const s = live.f > 7.5 ? 1 : k7 * smooth(remap(live.local[7], 0.1 + i * 0.1, 0.24 + i * 0.1));
      g.scale.setScalar((s * (1 + Math.sin(s * Math.PI) * 0.12) + 0.0001) * S);
      g.visible = s > 0.001;
    });
    const lvl = live.f > 7.5 ? 1 : k7 * smooth(remap(live.local[7], 0.35, 0.85));
    if (got.IS_WaterTower_Fill) got.IS_WaterTower_Fill.scale.y = 0.08 + lvl * 0.9;
    dropsRef.current.forEach((m, i) => {
      if (!m) return;
      m.visible = lvl > 0.02 && lvl < 0.98 && Math.abs(live.f - 7) < 0.4;
      const u = (t * 0.9 + i * 0.25) % 1;
      m.position.y = 5.2 - u * 1.6;
      m.scale.setScalar(0.6 + (1 - u) * 0.5);
    });
  });

  return (
    <group name="IS_Island">
      <primitive object={isl.root} />

      {/* Módulos extras do cap. 7, nos empties IS_Module_Slot_2..4 */}
      {isl.slots.map((p, i) => (
        <group key={i} position={p} ref={(g) => { slots.current[i] = g; }} scale={0.0001} visible={false}>
          <ModuleLite />
        </group>
      ))}

      {/* Cristais de sal sobre o poço (cap. 1) */}
      <group position={WELL}>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            ref={(m) => { crystals.current[i] = m; }}
            position={[[-0.75, 0.05, 0.8][i], 2.35, [0.35, -0.2, 0.5][i]]}
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

      {/* Gotas caindo na caixa d'água (cap. 7) */}
      <group position={TOWER}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} ref={(m) => { dropsRef.current[i] = m; }} position={[(i % 2) * 0.3 - 0.15, 4.9, ((i >> 1) % 2) * 0.3 - 0.15]} material={M.water} visible={false}>
            <sphereGeometry args={[0.09, 12, 10]} />
          </mesh>
        ))}
      </group>

      {/* Três folhas de rascunho que se dobram em sequência (cap. 2) */}
      <group ref={papersGrp} position={[0, -7, 0]} visible={false}>
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
      </group>
    </group>
  );
}

useGLTF.preload(ISLAND_URL, DRACO);
