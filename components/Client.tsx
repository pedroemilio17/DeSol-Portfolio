'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Lenis from 'lenis';
import { chapters, crystals, cycleSteps, cycleStops, layers, names } from '@/lib/content';
import { live, useUI } from '@/lib/state';
import { Badge } from './ui';

const Experience = dynamic(() => import('./scene/Experience'), { ssr: false });

let lenis: Lenis | null = null;
const goTo = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.4 });
  else el.scrollIntoView();
  history.replaceState(null, '', `#${id}`);
};
/** Leva o scroll do cap. 3 até o passo i do ciclo (mesma conta do compute, ao contrário). */
const goToStep = (i: number) => {
  const s = document.getElementById('como-funciona');
  if (!s) return;
  const y = s.offsetTop + s.offsetHeight * (0.14 + (cycleStops[i] + 0.02) * 0.72) - innerHeight / 2;
  if (lenis) lenis.scrollTo(y, { duration: 0.9 });
  else scrollTo(0, y);
};

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Liga scroll, tema, ponteiro e modo (3D ou estático). Não renderiza nada. */
export function ScrollDriver() {
  useEffect(() => {
    const ui = useUI.getState();
    const q = new URLSearchParams(location.search);
    const shot = q.get('shot');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || shot !== null;
    const mobile = matchMedia('(max-width: 820px), (pointer: coarse)').matches;
    const mode = q.get('static') !== null || !hasWebGL() ? 'static' : '3d';
    ui.set({ reduced, mobile, mode });
    live.snap = reduced;
    live.flat = shot !== null && q.get('keep') === null;
    const root = document.documentElement;
    root.classList.toggle('is-3d', mode === '3d');
    root.classList.toggle('is-static', mode !== '3d');
    if (shot !== null) root.classList.add('is-shot');

    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[data-chapter]'));

    const compute = () => {
      const vh = innerHeight;
      const c = scrollY + vh / 2;
      let active = 0;
      sections.forEach((s, i) => {
        const T = s.offsetTop;
        const H = s.offsetHeight;
        const l = Math.min(1, Math.max(0, (c - T) / H));
        live.local[i] = l;
        s.style.setProperty('--p', l.toFixed(4));
        if (c >= T) active = i;
      });
      const s = sections[active];
      const dNext = s.offsetTop + s.offsetHeight - c;
      const dPrev = c - s.offsetTop;
      const Z = 0.7 * vh;
      let f = active;
      if (active < sections.length - 1 && dNext < 0.45 * vh) f = active + (0.45 * vh - dNext) / Z;
      else if (active > 0 && dPrev < 0.25 * vh) f = active - 1 + (0.45 * vh + dPrev) / Z;
      live.f = reduced ? Math.round(f) : f;

      const st = useUI.getState();
      const ch = Math.round(f);
      const patch: Partial<typeof st> = {};
      if (ch !== st.chapter) {
        patch.chapter = ch;
        root.dataset.theme = chapters[ch].theme;
        root.dataset.ch = String(ch);
      }
      const p = Math.min(1, Math.max(0, (live.local[3] - 0.14) / 0.72));
      let step = 0;
      cycleStops.forEach((v, i) => {
        if (p >= v) step = i;
      });
      if (step !== st.step) patch.step = step;
      const l2 = live.local[2];
      const fold = l2 > 0.72 ? 3 : l2 > 0.59 ? 2 : l2 > 0.46 ? 1 : 0;
      if (fold !== st.fold) patch.fold = fold;
      if (Object.keys(patch).length) st.set(patch);
    };

    if (!reduced) {
      lenis = new Lenis({
        lerp: 0.1,
        wheelMultiplier: 0.9,
        // card mais alto que a tela rola por dentro, com o scroll nativo
        prevent: (n) => n.classList?.contains('card') && n.scrollHeight > n.clientHeight + 1,
      });
      lenis.on('scroll', compute);
      (window as unknown as { __lenis: Lenis }).__lenis = lenis;
      const tick = (t: number) => lenis?.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }
    addEventListener('scroll', compute, { passive: true });
    addEventListener('resize', compute);
    root.dataset.theme = 'ink';
    compute();

    if (shot !== null) {
      const i = Number(shot);
      const pr = Number(q.get('p') ?? 0.5);
      const s = sections[i];
      const y = s.offsetTop + s.offsetHeight * pr - innerHeight / 2;
      scrollTo(0, Math.max(0, y));
      live.intro = 1;
      compute();
    }

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || reduced) return;
      live.px = (e.clientX / innerWidth) * 2 - 1;
      live.py = (e.clientY / innerHeight) * 2 - 1;
    };
    addEventListener('pointermove', move, { passive: true });

    // abertura: o "O" do logo vira o sol e a câmera recua
    const unsub = useUI.subscribe((s) => {
      if (!s.ready) return;
      unsub();
      if (reduced || scrollY > 80) live.intro = 1;
      else gsap.to(live, { intro: 1, duration: 3, ease: 'power1.inOut', delay: 0.15 });
    });
    if (mode === 'static') live.intro = 1;

    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
      { rootMargin: '0px 0px -12% 0px' },
    );
    document.querySelectorAll('.rv').forEach((el) => io.observe(el));

    const onHash = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href')!.slice(1);
      if (!document.getElementById(id)) return;
      e.preventDefault();
      goTo(id);
    };
    document.addEventListener('click', onHash);

    // modo apresentação: ← → andam por capítulo; dentro do ciclo, por passo
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      if (e.altKey || e.ctrlKey || e.metaKey || (e.target as HTMLElement).closest?.('input,textarea,select,[contenteditable]')) return;
      const { chapter, step } = useUI.getState();
      const d = e.key === 'ArrowRight' ? 1 : -1;
      e.preventDefault();
      if (mode === '3d' && chapter === 3 && step + d >= 0 && step + d < cycleStops.length) return goToStep(step + d);
      const n = chapter + d;
      if (n >= 0 && n < chapters.length) goTo(chapters[n].id);
    };
    addEventListener('keydown', onKey);

    return () => {
      removeEventListener('keydown', onKey);
      removeEventListener('scroll', compute);
      removeEventListener('resize', compute);
      removeEventListener('pointermove', move);
      document.removeEventListener('click', onHash);
      io.disconnect();
      lenis?.destroy();
      lenis = null;
    };
  }, []);
  return null;
}

/** Palco fixo: poster na hora, canvas 3D depois. */
export function Stage() {
  const mode = useUI((s) => s.mode);
  const ready = useUI((s) => s.ready);
  const [go, setGo] = useState(false);
  // a cena só monta depois do load, para o texto e o poster pintarem primeiro
  useEffect(() => {
    const start = () => {
      const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
      if (ric) ric(() => setGo(true), { timeout: 1200 });
      else setTimeout(() => setGo(true), 300);
    };
    if (document.readyState === 'complete') start();
    else addEventListener('load', start, { once: true });
  }, []);
  return (
    <div className={`stage${ready ? ' is-ready' : ''}`} aria-hidden="true">
      {mode === '3d' && go && <Experience />}
    </div>
  );
}

export function DotNav() {
  const chapter = useUI((s) => s.chapter);
  return (
    <nav className="dots" aria-label="Capítulos">
      <ol>
        {chapters.map((c, i) => (
          <li key={c.id}>
            <a href={`#${c.id}`} aria-label={c.nav} aria-current={chapter === i ? 'step' : undefined} className={chapter === i ? 'is-on' : ''}>
              <span className="dots__label">
                <i>{String(i).padStart(2, '0')}</i> {c.nav}
              </span>
              <span className="dots__dot" />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Nome do capítulo atual no cabeçalho. Decorativo: o DotNav já anuncia aria-current. */
export function ChapterLabel() {
  const chapter = useUI((s) => s.chapter);
  if (chapter === 0) return null;
  return (
    <p className="top__where" aria-hidden="true">
      <i>
        {String(chapter).padStart(2, '0')} / {String(chapters.length - 1).padStart(2, '0')}
      </i>{' '}
      {chapters[chapter].nav}
    </p>
  );
}

/** Troca entre a cena 3D e a versão estática (posters), para aparelhos modestos. */
export function LiteToggle() {
  const mode = useUI((s) => s.mode);
  if (mode === 'pending') return null;
  if (mode === '3d')
    return (
      <a className="top__lite" href="?static">
        Modo leve
      </a>
    );
  // sem WebGL não há 3D para voltar
  if (!/[?&]static/.test(location.search)) return null;
  return (
    <a className="top__lite" href={location.pathname}>
      Ver em 3D
    </a>
  );
}

/** Cursor-gota: ciano sobre água, laranja sobre sal. */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const crystal = useUI((s) => s.crystal);
  const hoverLayer = useUI((s) => s.hoverLayer);
  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const el = ref.current!;
    document.documentElement.classList.add('has-cursor');
    let x = innerWidth / 2;
    let y = innerHeight / 2;
    let tx = x;
    let ty = y;
    let raf = 0;
    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      el.style.opacity = '1';
      const t = e.target as HTMLElement;
      el.dataset.tone = t.closest?.('[data-cursor="brine"]') ? 'brine' : '';
      el.dataset.big = t.closest?.('a,button,[role="button"]') ? '1' : '';
    };
    const loop = () => {
      x += (tx - x) * 0.28;
      y += (ty - y) * 0.28;
      el.style.transform = `translate3d(${x}px,${y}px,0)`;
      raf = requestAnimationFrame(loop);
    };
    addEventListener('pointermove', move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      removeEventListener('pointermove', move);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div ref={ref} className="cursor" aria-hidden="true" data-3d={crystal !== null ? 'brine' : hoverLayer ? 'pick' : ''}>
      <span />
    </div>
  );
}

export function CrystalList() {
  const crystal = useUI((s) => s.crystal);
  const set = useUI((s) => s.set);
  return (
    <ul className="crystals" data-cursor="brine">
      {crystals.map((c, i) => (
        <li key={c.name} className={crystal === i ? 'is-on' : ''} onPointerEnter={() => set({ crystal: i })} onPointerLeave={() => set({ crystal: null })}>
          <span className="crystals__gem" aria-hidden="true" />
          <p>
            <strong>{c.name}</strong> — {c.text}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function Names() {
  const fold = useUI((s) => s.fold);
  const is3d = useUI((s) => s.mode) === '3d';
  return (
    <ol className="names">
      {names.map((n, i) => (
        <li key={n} className={!is3d || fold > i ? 'is-on' : ''}>
          {i > 0 && <span aria-hidden="true">→</span>}
          <b>{n}</b>
        </li>
      ))}
    </ol>
  );
}

export function CycleSteps() {
  const step = useUI((s) => s.step);
  const is3d = useUI((s) => s.mode) === '3d';
  return (
    <ol className={`steps${is3d ? ' steps--live' : ''}`}>
      {cycleSteps.map((s, i) => (
        <li key={s.title} className={i === step ? 'is-on' : i < step ? 'is-done' : ''} aria-current={is3d && i === step ? 'step' : undefined}>
          {is3d ? (
            <button type="button" className="steps__n" aria-label={`Ir para o passo ${i + 1}: ${s.title}`} onClick={() => goToStep(i)}>
              {i + 1}
            </button>
          ) : (
            <span className="steps__n">{i + 1}</span>
          )}
          <p onClick={is3d ? () => goToStep(i) : undefined}>
            <strong>{s.title}</strong> {s.text}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function LayerList() {
  const layer = useUI((s) => s.layer);
  const hover = useUI((s) => s.hoverLayer);
  const is3d = useUI((s) => s.mode) === '3d';
  const set = useUI((s) => s.set);
  return (
    <ol className="layers">
      {layers.map((l, i) => {
        const open = !is3d || layer === l.key;
        return (
          <li key={l.key} className={`${open ? 'is-open' : ''} ${hover === l.key ? 'is-hover' : ''}`}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => set({ layer: layer === l.key ? null : l.key })}
              onPointerEnter={() => set({ hoverLayer: l.key })}
              onPointerLeave={() => set({ hoverLayer: null })}
            >
              <span className="layers__n">{String(i + 1).padStart(2, '0')}</span>
              <span className="layers__t">{l.title}</span>
            </button>
            <div className="layers__body">
              <p>
                {l.text} <Badge kind="projetado" />
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Número que conta até o valor quando entra na tela. */
export function Counter({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (n: number) => `${prefix}${Math.round(n).toLocaleString('pt-BR')}${suffix}`;
  useEffect(() => {
    const el = ref.current!;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const o = { v: 0 };
    el.textContent = fmt(0);
    const io = new IntersectionObserver(
      (es) => {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        gsap.to(o, { v: to, duration: 1.6, ease: 'power3.out', onUpdate: () => (el.textContent = fmt(o.v)) });
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);
  return <span ref={ref}>{fmt(to)}</span>;
}
