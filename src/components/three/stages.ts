import { type StepKey, howItWorks } from "@/content/content";

/**
 * Narrativa por scroll (decisions §2.1). Um único número, o progresso (0 → 1),
 * vira todos os uniforms da cena. A Fase 3c só precisa animar o progresso.
 *
 * | Trecho          | Progresso   | O que acontece                                   |
 * | Hero            | 0           | caos com deriva lenta                            |
 * | Problema        | 0 → 0,30    | deriva desacelera, blocos puxados para o plano   |
 * | Solução         | 0,30 → 0,60 | encaixe em onda do centro, brilho na aresta      |
 * | Think           | 0,60 → 0,70 | só os contornos                                  |
 * | Develop         | 0,70 → 0,80 | preenchem e extrudam                             |
 * | Deliver         | 0,80 → 0,90 | estrutura sobe e ganha luz                       |
 * | Repeat          | 0,90 → 1    | pulso em loop pelo grid                          |
 */

export const PROBLEM_END = 0.3;
export const SOLUTION_END = 0.6;

const range = (key: StepKey) => {
  const step = howItWorks.steps.find((s) => s.key === key);
  if (!step) throw new Error(`Etapa desconhecida: ${key}`);
  return step.range;
};

/** Faixas das etapas, lidas do content.ts (mesma fonte do texto da seção). */
export const stepRanges = {
  think: range("think"),
  develop: range("develop"),
  deliver: range("deliver"),
  repeat: range("repeat"),
} as const;

export interface StageUniforms {
  /** Deriva do caos: 1 = livre, 0 = parada. */
  drift: number;
  /** Puxão dos blocos dispersos em direção ao plano (antes do encaixe). */
  pull: number;
  /** Montagem: 0 = caos, 1 = todos encaixados. Cada bloco usa seu atraso. */
  assemble: number;
  /** Preenchimento das faces: 1 = sólido, 0 = só contornos. */
  fill: number;
  /** Extrusão dos painéis. */
  extrude: number;
  /** Subida e luz da estrutura. */
  lift: number;
  /** Intensidade do pulso em loop. */
  pulse: number;
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 0 antes de `a`, 1 depois de `b`, suave no meio (igual ao smoothstep do GLSL). */
export function smoothstep(a: number, b: number, v: number) {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}

export function stageUniforms(progress: number): StageUniforms {
  const p = clamp01(progress);
  const { think, develop, deliver, repeat } = stepRanges;
  const thinkMid = (think[0] + think[1]) / 2;
  const developMid = (develop[0] + develop[1]) / 2;

  return {
    drift: 1 - smoothstep(0, SOLUTION_END, p),
    pull: smoothstep(0, PROBLEM_END, p),
    assemble: smoothstep(PROBLEM_END, SOLUTION_END, p),
    // some no início do Think, volta no início do Develop
    fill: 1 - smoothstep(think[0], thinkMid, p) + smoothstep(develop[0], developMid, p),
    extrude: smoothstep(develop[0], develop[1], p),
    lift: smoothstep(deliver[0], deliver[1], p),
    pulse: smoothstep(repeat[0], repeat[0] + (repeat[1] - repeat[0]) / 2, p),
  };
}

/** Etapa do lema ativa para um progresso (null antes do Think). */
export function activeStep(progress: number): StepKey | null {
  const p = clamp01(progress);
  const step = howItWorks.steps.find(
    (s, i, all) => p >= s.range[0] && (p < s.range[1] || i === all.length - 1),
  );
  return step?.key ?? null;
}
