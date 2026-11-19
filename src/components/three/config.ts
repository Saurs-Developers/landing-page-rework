/**
 * Constantes da cena do hero (decisions §2). Valores visuais (cores, tamanho
 * da célula do grid) vêm de tokens.css em runtime; aqui ficam só geometria,
 * câmera e orçamento, que não existem no CSS.
 */

export type Tier = "high" | "medium" | "static";

export interface TierConfig {
  /** Colunas × linhas do grid; um bloco por célula. */
  cols: number;
  rows: number;
  /** Teto do devicePixelRatio. */
  maxDpr: number;
}

export const tiers: Record<Exclude<Tier, "static">, TierConfig> = {
  high: { cols: 60, rows: 40, maxDpr: 2 }, // 2.400 blocos
  medium: { cols: 40, rows: 25, maxDpr: 1.5 }, // 1.000 blocos
};

export const blockCount = (t: TierConfig) => t.cols * t.rows;

/** Câmera. A mesma perspectiva é aplicada ao grid em CSS (fallback). */
export const camera = {
  /** Campo de visão vertical, em graus. */
  fov: 35,
  /** Elevação da câmera sobre o plano do grid, em graus (90 = vista de cima). */
  elevation: 52,
  /** Paralaxe máxima do cursor, em graus (decisions §2.2). */
  parallax: 2.5,
  /** Suavização da paralaxe por frame. */
  parallaxLerp: 0.08,
} as const;

/** Mundo: 1 unidade = 1 célula do grid. */
export const world = {
  /** Lado do bloco em relação à célula (o resto é o vão). */
  blockSize: 0.8,
  /** Altura do bloco antes da extrusão. */
  baseHeight: 0.14,
  /** Altura máxima extra na etapa Develop. */
  maxExtrude: 2.4,
  /** Quanto a estrutura sobe na etapa Deliver. */
  lift: 0.35,
  /** Volume do caos: altura mínima e máxima dos blocos dispersos. */
  chaosYMin: 0.6,
  chaosYMax: 7,
  /** Espalhamento horizontal do caos em relação ao tamanho do grid. */
  chaosSpread: 1.4,
} as const;

/** Cursor (decisions §2.2). */
export const pointer = {
  /** Raio de influência, em células. */
  radius: 2.5,
  /** Quanto o cursor adianta o encaixe (em unidades de progresso de montagem). */
  boost: 0.55,
  /** Suavização da posição e da força. */
  lerp: 0.12,
} as const;

/** Qualidade adaptativa (decisions §2.4). */
export const quality = {
  /** Ignora os primeiros ms (compilação de shader, upload de buffers). */
  warmupMs: 2000,
  /** Janela de amostragem do FPS. */
  windowMs: 1000,
  /** high → medium quando a média fica abaixo disto… */
  downgradeFps: 45,
  /** …por esta quantidade de janelas seguidas. */
  downgradeWindows: 2,
  /** medium → static quando fica abaixo de 30 FPS por 3 janelas. */
  staticFps: 30,
  staticWindows: 3,
} as const;

/** Altura de referência para a distância da câmera (ver cameraDistance). */
export function cameraDistance(viewportHeightPx: number, cellPx: number, fovDeg = camera.fov) {
  // Distância em que 1 unidade do mundo mede exatamente `cellPx` no centro da
  // tela. Assim o grid 3D e o grid em CSS (mesma perspectiva) coincidem.
  const halfFov = (fovDeg * Math.PI) / 360;
  return viewportHeightPx / (2 * Math.tan(halfFov) * cellPx);
}
