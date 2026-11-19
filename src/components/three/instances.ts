import { type TierConfig, blockCount, world } from "./config";

/**
 * Atributos por instância da InstancedMesh (decisions §2.3), gerados uma vez
 * e de forma determinística (mesma semente → mesma cena, inclusive na imagem
 * de fallback renderizada no build).
 */
export interface InstanceData {
  count: number;
  /** Posição no caos (x, y, z). */
  chaos: Float32Array;
  /** Centro da célula no grid (x, 0, z). */
  order: Float32Array;
  /** Altura relativa na etapa Develop (0 = bloco baixo, 1 = altura máxima). */
  height: Float32Array;
  /** Atraso do encaixe, 0 (centro) → 1 (bordas), para a onda. */
  delay: Float32Array;
  /** Aleatório por bloco (fase da deriva, eixo de rotação). */
  seed: Float32Array;
}

/** PRNG pequeno e determinístico (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Panel {
  x: number;
  z: number;
  w: number;
  d: number;
  kind: "bars" | "card" | "kpi";
}

/**
 * Painéis de um "dashboard" abstrato: retângulos sem sobreposição, com tipos
 * diferentes de relevo. Ficam concentrados no miolo do grid, que é o que a
 * câmera enquadra.
 */
function layoutPanels(cols: number, rows: number, random: () => number): Panel[] {
  const panels: Panel[] = [];
  const taken = new Uint8Array(cols * rows);
  const marginX = Math.round(cols * 0.18);
  const marginZ = Math.round(rows * 0.2);
  const kinds: Panel["kind"][] = ["bars", "card", "bars", "kpi", "card"];
  const target = Math.round((cols * rows) / 140);

  for (let attempt = 0; attempt < target * 40 && panels.length < target; attempt++) {
    const kind = kinds[panels.length % kinds.length];
    const w = kind === "kpi" ? 2 + Math.floor(random() * 2) : 4 + Math.floor(random() * 5);
    const d = kind === "bars" ? 2 + Math.floor(random() * 2) : 2 + Math.floor(random() * 3);
    const x = marginX + Math.floor(random() * (cols - 2 * marginX - w));
    const z = marginZ + Math.floor(random() * (rows - 2 * marginZ - d));
    if (x < 0 || z < 0) continue;

    let free = true;
    // 1 célula de respiro em volta de cada painel
    for (let i = x - 1; i <= x + w && free; i++) {
      for (let j = z - 1; j <= z + d && free; j++) {
        if (i >= 0 && j >= 0 && i < cols && j < rows && taken[j * cols + i]) free = false;
      }
    }
    if (!free) continue;
    for (let i = x; i < x + w; i++) for (let j = z; j < z + d; j++) taken[j * cols + i] = 1;
    panels.push({ x, z, w, d, kind });
  }
  return panels;
}

export function buildInstances(tier: TierConfig, seed = 7): InstanceData {
  const { cols, rows } = tier;
  const count = blockCount(tier);
  const random = rng(seed);

  const chaos = new Float32Array(count * 3);
  const order = new Float32Array(count * 3);
  const height = new Float32Array(count);
  const delay = new Float32Array(count);
  const seeds = new Float32Array(count);

  const heightMap = new Float32Array(count);
  for (const p of layoutPanels(cols, rows, random)) {
    const barPhase = random() * Math.PI * 2;
    const level = 0.25 + random() * 0.35;
    for (let i = p.x; i < p.x + p.w; i++) {
      for (let j = p.z; j < p.z + p.d; j++) {
        const k = j * cols + i;
        if (p.kind === "bars") {
          // colunas de um gráfico de barras: mesma altura ao longo da profundidade
          const t = (i - p.x) / Math.max(1, p.w - 1);
          heightMap[k] = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(barPhase + t * 4.2)) * (0.6 + 0.4 * t);
        } else if (p.kind === "kpi") {
          heightMap[k] = 0.85 + random() * 0.15;
        } else {
          heightMap[k] = level * 0.45;
        }
      }
    }
  }

  const halfW = (cols - 1) / 2;
  const halfD = (rows - 1) / 2;
  const spreadX = (cols / 2) * world.chaosSpread;
  const spreadZ = (rows / 2) * world.chaosSpread;

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      const ox = i - halfW;
      const oz = j - halfD;
      order.set([ox, 0, oz], k * 3);

      const r = random();
      chaos.set(
        [
          (random() * 2 - 1) * spreadX,
          world.chaosYMin + (world.chaosYMax - world.chaosYMin) * Math.pow(r, 1.6),
          (random() * 2 - 1) * spreadZ,
        ],
        k * 3,
      );

      // distância elíptica normalizada até o centro → onda do centro para fora
      const dist = Math.min(1, Math.hypot(ox / halfW, oz / halfD) / Math.SQRT2);
      delay[k] = Math.min(1, Math.max(0, dist * 0.85 + random() * 0.15));
      height[k] = heightMap[k];
      seeds[k] = random();
    }
  }

  return { count, chaos, order, height, delay, seed: seeds };
}
