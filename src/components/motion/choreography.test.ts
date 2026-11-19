import { describe, expect, it, vi } from "vitest";
import { createRafDriver, onFrame, setFrameDriver } from "@/components/three/controls";
import { buildKeyframes, type Layout, normalize, progressAt } from "./choreography";

const layout: Layout = {
  viewportHeight: 800,
  problem: { top: 900, bottom: 1800 },
  solution: { top: 1800, bottom: 2900 },
  steps: [
    { top: 3000, bottom: 3600 },
    { top: 3600, bottom: 4200 },
    { top: 4200, bottom: 4800 },
    { top: 4800, bottom: 5400 },
  ],
};

describe("buildKeyframes", () => {
  const frames = buildKeyframes(layout);

  it("prende cada trecho à sua seção (linha do centro da tela)", () => {
    expect(frames[0]).toEqual({ scroll: 0, progress: 0 });
    expect(frames[1]).toEqual({ scroll: 1400, progress: 0.3 });
    expect(frames[2]).toEqual({ scroll: 2500, progress: 0.6 });
    expect(frames[3]).toEqual({ scroll: 2600, progress: 0.6 }); // Think começa
    expect(frames.at(-1)).toEqual({ scroll: 5000, progress: 1 });
  });

  it("progresso nunca diminui ao rolar para baixo", () => {
    let last = -1;
    for (let y = 0; y <= 6000; y += 25) {
      const p = progressAt(y, frames);
      expect(p).toBeGreaterThanOrEqual(last);
      last = p;
    }
  });

  it("valores nos pontos intermediários", () => {
    expect(progressAt(700, frames)).toBeCloseTo(0.15);
    expect(progressAt(2550, frames)).toBeCloseTo(0.6); // entre Solução e Think
    expect(progressAt(2900, frames)).toBeCloseTo(0.65); // meio do Think
    expect(progressAt(9999, frames)).toBe(1);
    expect(progressAt(-50, frames)).toBe(0);
  });
});

describe("normalize", () => {
  it("corrige layouts que voltariam no tempo", () => {
    const out = normalize([
      { scroll: 0, progress: 0 },
      { scroll: 500, progress: 0.3 },
      { scroll: 300, progress: 0.2 },
    ]);
    expect(out[2]).toEqual({ scroll: 500, progress: 0.3 });
  });

  it("scroll negativo vira 0 (seção acima da metade da primeira tela)", () => {
    expect(normalize([{ scroll: -200, progress: 0.3 }])[0].scroll).toBe(0);
  });
});

describe("relógio único", () => {
  it("rAF driver só roda com inscritos", () => {
    const raf = vi.fn(() => 1);
    const cancel = vi.fn();
    const d = createRafDriver(raf, cancel);
    const t = () => {};
    d.add(t);
    expect(raf).toHaveBeenCalledTimes(1);
    d.remove(t);
    expect(cancel).toHaveBeenCalledWith(1);
  });

  it("troca de driver mantém os inscritos e para o anterior", () => {
    const calls: string[] = [];
    let aTick: ((n: number) => void) | null = null;
    let bTick: ((n: number) => void) | null = null;
    const a = { add: (t: (n: number) => void) => (aTick = t), remove: () => (aTick = null) };
    const b = { add: (t: (n: number) => void) => (bTick = t), remove: () => (bTick = null) };
    setFrameDriver(a);
    const off = onFrame((now) => calls.push(`tick ${now}`));
    aTick!(1);
    setFrameDriver(b);
    expect(aTick).toBeNull();
    bTick!(2);
    off();
    expect(bTick).toBeNull();
    expect(calls).toEqual(["tick 1", "tick 2"]);
  });
});
