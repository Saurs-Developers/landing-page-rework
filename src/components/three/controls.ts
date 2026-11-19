/**
 * Estado compartilhado da cena, fora do React (decisions §2.3: "nada de estado
 * React por frame"). Não importa three nem GSAP, então qualquer parte da página
 * pode escrever aqui sem puxar os chunks pesados.
 *
 * - A coreografia (src/components/motion) escreve `progress` (0 → 1).
 * - O canvas lê a cada frame e suaviza.
 * - `onFrame` é o relógio único da página: começa com requestAnimationFrame e,
 *   quando o GSAP carrega, passa a ser o `gsap.ticker`. Assim Lenis, ScrollTrigger
 *   e a cena atualizam no mesmo tick, nessa ordem, sem um frame de atraso.
 */
export interface SceneControls {
  /** Progresso alvo da narrativa, 0 (topo do hero) → 1 (fim de "Como funciona"). */
  progress: number;
  /** Suavização do progresso por frame (0–1). 1 = sem suavização. */
  progressLerp: number;
  /** Congela o tempo (captura do fallback): sem deriva nem pulso animado. */
  frozenTime: number | null;
  /** Desliga o cursor (telas de toque, captura). */
  pointerEnabled: boolean;
  /** Qualidade adaptativa pelo FPS (desligável no debug com `&fps=off`). */
  adaptive: boolean;
}

export const sceneControls: SceneControls = {
  progress: 0,
  progressLerp: 0.12,
  frozenTime: null,
  pointerEnabled: true,
  adaptive: true,
};

export function setSceneProgress(value: number) {
  sceneControls.progress = Math.min(1, Math.max(0, value));
}

/* ------------------------------------------------------------------ */
/* Relógio único                                                      */
/* ------------------------------------------------------------------ */

export type Tick = (nowMs: number) => void;

export interface FrameDriver {
  add: (tick: Tick) => void;
  remove: (tick: Tick) => void;
}

/** Driver padrão: um laço de rAF que só roda enquanto há inscritos. */
export function createRafDriver(
  raf: (cb: FrameRequestCallback) => number = (cb) => requestAnimationFrame(cb),
  cancel: (id: number) => void = (id) => cancelAnimationFrame(id),
): FrameDriver {
  const ticks = new Set<Tick>();
  let id = 0;
  const loop = (now: number) => {
    id = raf(loop);
    for (const t of ticks) t(now);
  };
  return {
    add(tick) {
      ticks.add(tick);
      if (!id) id = raf(loop);
    },
    remove(tick) {
      ticks.delete(tick);
      if (ticks.size === 0 && id) {
        cancel(id);
        id = 0;
      }
    },
  };
}

const subscribers = new Set<Tick>();
const tickAll: Tick = (now) => {
  for (const t of subscribers) t(now);
};

let driver: FrameDriver | null = null;
const currentDriver = () => (driver ??= createRafDriver());

/** Inscreve uma função no relógio da página. Devolve o cancelamento. */
export function onFrame(tick: Tick): () => void {
  if (subscribers.size === 0) currentDriver().add(tickAll);
  subscribers.add(tick);
  return () => {
    subscribers.delete(tick);
    if (subscribers.size === 0) currentDriver().remove(tickAll);
  };
}

/** Troca o relógio (ex.: para o gsap.ticker) sem perder os inscritos. */
export function setFrameDriver(next: FrameDriver) {
  const prev = currentDriver();
  if (prev === next) return;
  if (subscribers.size > 0) {
    prev.remove(tickAll);
    next.add(tickAll);
  }
  driver = next;
}
