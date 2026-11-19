import { type Tier, quality } from "./config";

/**
 * Escolha inicial do tier (decisions §2.4) e monitor de FPS para rebaixar em
 * execução. Funções puras: o ambiente é injetado, para poder testar.
 */

export interface DeviceSignals {
  webgl2: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  /** navigator.deviceMemory (GB); undefined quando o navegador não expõe. */
  deviceMemory?: number;
  hardwareConcurrency?: number;
  /** (pointer: coarse) — telas de toque. */
  coarsePointer: boolean;
  viewportWidth: number;
}

export type StaticReason = "no-webgl" | "reduced-motion" | "save-data" | "low-memory";

export function initialTier(s: DeviceSignals): { tier: Tier; reason?: StaticReason } {
  if (s.reducedMotion) return { tier: "static", reason: "reduced-motion" };
  if (!s.webgl2) return { tier: "static", reason: "no-webgl" };
  if (s.saveData) return { tier: "static", reason: "save-data" };
  if (s.deviceMemory !== undefined && s.deviceMemory <= 2) {
    return { tier: "static", reason: "low-memory" };
  }
  const modest =
    s.coarsePointer ||
    s.viewportWidth < 768 ||
    (s.hardwareConcurrency !== undefined && s.hardwareConcurrency <= 4) ||
    (s.deviceMemory !== undefined && s.deviceMemory <= 4);
  return { tier: modest ? "medium" : "high" };
}

/** Lê os sinais no navegador. */
export function readDeviceSignals(): DeviceSignals {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  let webgl2 = false;
  try {
    const canvas = document.createElement("canvas");
    webgl2 = !!canvas.getContext("webgl2");
  } catch {
    webgl2 = false;
  }
  return {
    webgl2,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: nav.connection?.saveData === true,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    coarsePointer: matchMedia("(pointer: coarse)").matches,
    viewportWidth: innerWidth,
  };
}

export type Verdict = "keep" | "downgrade";

/**
 * Conta frames em janelas de `windowMs`, depois do aquecimento. Pede para
 * rebaixar quando a média fica abaixo do limite por N janelas seguidas.
 * Tempo ocioso (aba oculta, loop pausado) é descartado com `reset()`.
 */
export class FpsMonitor {
  private start = -1;
  private windowStart = -1;
  private frames = 0;
  private slowWindows = 0;

  constructor(
    private readonly minFps: number,
    private readonly windows: number,
    private readonly warmupMs = quality.warmupMs,
    private readonly windowMs = quality.windowMs,
  ) {}

  reset() {
    this.start = -1;
    this.windowStart = -1;
    this.frames = 0;
    this.slowWindows = 0;
  }

  /** Chame uma vez por frame com o tempo atual em ms. */
  tick(now: number): Verdict {
    if (this.start < 0) this.start = now;
    if (now - this.start < this.warmupMs) return "keep";
    if (this.windowStart < 0) {
      this.windowStart = now;
      this.frames = 0;
      return "keep";
    }
    this.frames++;
    const elapsed = now - this.windowStart;
    if (elapsed < this.windowMs) return "keep";

    const fps = (this.frames * 1000) / elapsed;
    this.windowStart = now;
    this.frames = 0;
    this.slowWindows = fps < this.minFps ? this.slowWindows + 1 : 0;
    return this.slowWindows >= this.windows ? "downgrade" : "keep";
  }
}

/** Monitor certo para cada tier em execução. */
export function monitorFor(tier: Exclude<Tier, "static">) {
  return tier === "high"
    ? new FpsMonitor(quality.downgradeFps, quality.downgradeWindows)
    : new FpsMonitor(quality.staticFps, quality.staticWindows);
}

export const nextTier = (tier: Exclude<Tier, "static">): Tier =>
  tier === "high" ? "medium" : "static";
