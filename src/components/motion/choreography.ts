/**
 * Mapeamento scroll → progresso da cena (decisions §2.1), em funções puras.
 *
 * O progresso não é proporcional ao scroll total: cada trecho da narrativa
 * fica preso à sua seção. A cena chega a 0,30 quando o fim do "Problema" passa
 * pelo centro da tela, a 0,60 no fim da "Solução", e cada etapa de "Como
 * funciona" vai de range[0] a range[1] enquanto o seu bloco cruza o centro.
 * Assim a cena muda exatamente junto com o texto que a explica.
 */

import { howItWorks, sectionIds } from "@/content/content";
import { PROBLEM_END, SOLUTION_END } from "@/components/three/stages";

export interface Keyframe {
  /** Posição de scroll (px, topo da página). */
  scroll: number;
  /** Progresso da cena nessa posição. */
  progress: number;
}

/** Retângulo de um elemento em coordenadas do documento. */
export interface Box {
  top: number;
  bottom: number;
}

export interface Layout {
  viewportHeight: number;
  problem: Box;
  solution: Box;
  /** Uma caixa por etapa, na ordem de howItWorks.steps. */
  steps: Box[];
}

/** Seletores dos elementos medidos (a 3d deve manter estes atributos). */
export const selectors = {
  problem: `#${sectionIds.problem}`,
  solution: `#${sectionIds.solution}`,
  howItWorks: `#${sectionIds.howItWorks}`,
  step: (key: string) => `[data-step="${key}"]`,
} as const;

/**
 * Pontos de controle: (scroll, progresso). O "centro" é a linha do meio da
 * tela; `scroll = y - viewportHeight / 2` é quando y cruza essa linha.
 */
export function buildKeyframes(layout: Layout): Keyframe[] {
  const center = (y: number) => y - layout.viewportHeight / 2;
  const frames: Keyframe[] = [
    { scroll: 0, progress: 0 },
    { scroll: center(layout.problem.bottom), progress: PROBLEM_END },
    { scroll: center(layout.solution.bottom), progress: SOLUTION_END },
  ];
  howItWorks.steps.forEach((step, i) => {
    const box = layout.steps[i];
    if (!box) return;
    frames.push({ scroll: center(box.top), progress: step.range[0] });
    frames.push({ scroll: center(box.bottom), progress: step.range[1] });
  });
  return normalize(frames);
}

/** Garante scroll e progresso não decrescentes (layouts estranhos não fazem a cena voltar). */
export function normalize(frames: Keyframe[]): Keyframe[] {
  const out: Keyframe[] = [];
  for (const f of frames) {
    const prev = out.at(-1);
    const scroll = Math.max(0, prev ? Math.max(prev.scroll, f.scroll) : f.scroll);
    const progress = prev ? Math.max(prev.progress, f.progress) : f.progress;
    out.push({ scroll, progress });
  }
  return out;
}

/** Interpolação linear por trechos; constante antes do primeiro e depois do último ponto. */
export function progressAt(scroll: number, frames: Keyframe[]): number {
  if (frames.length === 0) return 0;
  if (scroll <= frames[0].scroll) return frames[0].progress;
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1];
    const b = frames[i];
    if (scroll <= b.scroll) {
      const span = b.scroll - a.scroll;
      if (span <= 0) return b.progress;
      return a.progress + ((scroll - a.scroll) / span) * (b.progress - a.progress);
    }
  }
  return frames[frames.length - 1].progress;
}

/** Mede o layout real no documento. Devolve null se faltar alguma seção. */
export function measureLayout(doc: Document = document): Layout | null {
  const box = (sel: string): Box | null => {
    const el = doc.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top + scrollY, bottom: r.bottom + scrollY };
  };
  const problem = box(selectors.problem);
  const solution = box(selectors.solution);
  const steps = howItWorks.steps.map((s) => box(selectors.step(s.key)));
  if (!problem || !solution || steps.some((s) => !s)) return null;
  return { viewportHeight: innerHeight, problem, solution, steps: steps as Box[] };
}
