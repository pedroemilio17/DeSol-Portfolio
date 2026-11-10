import * as THREE from 'three';

/** Paleta dos materiais (docs/04_BLENDER_3D.md, seção 1). */
export const C = {
  sun: '#FFF23F',
  ink: '#0E0F0C',
  paper: '#F5F1E6',
  water: '#1EC8E6',
  brine: '#FF5A36',
  leaf: '#2FBF71',
  leafDark: '#22A862',
  grass: '#3FBF6E',
  cerrado: '#C98B4A',
  cerradoDark: '#A66A36',
  wood: '#B07A4F',
  eps: '#E8E4DA',
  alu: '#9AA3A8',
  steel: '#C9D1D6',
  road: '#EBD3A4',
  table: '#DDCDAA',
};

/** Módulo: escala no mundo e posição do slot principal. */
export const S = 2;
export const MO = new THREE.Vector3(0, 0, 0.3);
/** Converte coordenada local do módulo (metros) para o mundo. */
export const mw = (x: number, y: number, z: number) =>
  new THREE.Vector3(x * S + MO.x, y * S + MO.y, z * S + MO.z);

/** Plano de corte do cap. 3 (corte lateral). constant alto = sem corte. */
export const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 100);

const std = (color: string, o: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0, ...o });

const make = (clip: boolean) => {
  const x: THREE.MeshStandardMaterialParameters = clip
    ? { clippingPlanes: [clipPlane], clipShadows: true, side: THREE.DoubleSide }
    : {};
  return {
    sun: std(C.sun, { emissive: C.sun, emissiveIntensity: 2.2, ...x }),
    ink: std(C.ink, { roughness: 0.85, ...x }),
    paper: std(C.paper, x),
    paper2: std('#E3DCC8', x),
    sun2: std(C.sun, { emissive: C.sun, emissiveIntensity: 0.25, roughness: 0.5, ...x }),
    brine2: std(C.brine, { emissive: C.brine, emissiveIntensity: 0.45, roughness: 0.25, flatShading: true, ...x }),
    water: std(C.water, { roughness: 0.15, emissive: C.water, emissiveIntensity: 0.25, ...x }),
    brine: std(C.brine, { roughness: 0.3, ...x }),
    leaf: std(C.leaf, x),
    leafDark: std(C.leafDark, x),
    grass: std(C.grass, { roughness: 0.9, ...x }),
    cerrado: std(C.cerrado, { roughness: 0.9, ...x }),
    cerradoDark: std(C.cerradoDark, { roughness: 0.9, ...x }),
    wood: std(C.wood, { roughness: 0.7, ...x }),
    eps: std(C.eps, { roughness: 0.9, ...x }),
    alu: std(C.alu, { metalness: 0.9, roughness: 0.35, ...x }),
    steel: std(C.steel, { metalness: 0.9, roughness: 0.2, ...x }),
    road: std(C.road, { roughness: 0.95, ...x }),
    table: std(C.table, { roughness: 0.8, ...x }),
    white: std('#FFFFFF', { roughness: 0.8, ...x }),
    glass: std('#CFF3F8', {
      transparent: true,
      opacity: 0.26,
      roughness: 0.05,
      metalness: 0.1,
      depthWrite: false,
      ...x,
    }),
  };
};

/** Materiais da ilha (sem corte) e do módulo (com plano de corte). */
export const M = make(false);
export const MC = make(true);
