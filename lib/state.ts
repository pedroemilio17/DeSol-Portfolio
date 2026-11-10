import { create } from 'zustand';

/**
 * Estado "vivo" lido a cada quadro pela cena 3D, sem passar pelo React.
 * f      = capítulo contínuo (3.4 = 40% da transição do cap. 3 para o 4)
 * local  = progresso 0–1 do centro da tela dentro de cada capítulo
 */
export const live = {
  f: 0,
  local: new Float32Array(9),
  px: 0,
  py: 0,
  intro: 0,
  snap: false,
  /** modo captura de poster: cena centralizada, sem deslocamento para os cards */
  flat: false,
};

export type Mode = 'pending' | '3d' | 'static';

type UI = {
  chapter: number;
  step: number;
  fold: number;
  layer: string | null;
  hoverLayer: string | null;
  crystal: number | null;
  mode: Mode;
  ready: boolean;
  reduced: boolean;
  mobile: boolean;
  set: (p: Partial<UI>) => void;
};

export const useUI = create<UI>((set) => ({
  chapter: 0,
  step: 0,
  fold: 0,
  layer: null,
  hoverLayer: null,
  crystal: null,
  mode: 'pending',
  ready: false,
  reduced: false,
  mobile: false,
  set: (p) => set(p),
}));

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const remap = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));
export const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
/** 0 longe do capítulo i, 1 quando a câmera está parada nele. */
export const near = (i: number, a = 0.3, b = 0.9) => smooth(remap(1 - Math.abs(live.f - i), a, b));
