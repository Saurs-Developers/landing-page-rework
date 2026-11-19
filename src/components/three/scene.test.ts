import { describe, expect, it } from "vitest";
import { over, parseCssColor } from "./color";
import { blockCount, cameraDistance, tiers } from "./config";
import { buildInstances, rng } from "./instances";
import { FpsMonitor, type DeviceSignals, initialTier, nextTier } from "./quality";
import { activeStep, stageUniforms, stepRanges } from "./stages";

describe("tiers", () => {
  it("respeitam o orçamento de blocos do decisions §2.4", () => {
    expect(blockCount(tiers.high)).toBe(2400);
    expect(blockCount(tiers.medium)).toBe(1000);
  });

  it("câmera: 1 célula mede cellPx no centro da tela", () => {
    const d = cameraDistance(900, 56, 35);
    const pxPerUnit = 900 / (2 * d * Math.tan((35 * Math.PI) / 360));
    expect(pxPerUnit).toBeCloseTo(56);
  });
});

describe("buildInstances", () => {
  const data = buildInstances(tiers.medium, 7);

  it("gera um conjunto completo de atributos", () => {
    expect(data.count).toBe(1000);
    expect(data.chaos).toHaveLength(3000);
    expect(data.order).toHaveLength(3000);
    expect(data.height).toHaveLength(1000);
    expect(data.delay).toHaveLength(1000);
  });

  it("é determinístico", () => {
    const again = buildInstances(tiers.medium, 7);
    expect(Array.from(again.chaos)).toEqual(Array.from(data.chaos));
    expect(Array.from(again.height)).toEqual(Array.from(data.height));
  });

  it("ordem: uma célula por bloco, sem repetição, no plano y = 0", () => {
    const cells = new Set<string>();
    for (let i = 0; i < data.count; i++) {
      expect(data.order[i * 3 + 1]).toBe(0);
      cells.add(`${data.order[i * 3]},${data.order[i * 3 + 2]}`);
    }
    expect(cells.size).toBe(data.count);
  });

  it("caos fica acima do plano; atrasos e alturas em 0–1", () => {
    for (let i = 0; i < data.count; i++) {
      expect(data.chaos[i * 3 + 1]).toBeGreaterThan(0);
      expect(data.delay[i]).toBeGreaterThanOrEqual(0);
      expect(data.delay[i]).toBeLessThanOrEqual(1);
      expect(data.height[i]).toBeGreaterThanOrEqual(0);
      expect(data.height[i]).toBeLessThanOrEqual(1);
    }
  });

  it("existem painéis extrudados (dashboard) mas a maioria fica baixa", () => {
    const tall = Array.from(data.height).filter((h) => h > 0).length;
    expect(tall).toBeGreaterThan(data.count * 0.05);
    expect(tall).toBeLessThan(data.count * 0.5);
  });

  it("a onda sai do centro: atraso médio do centro < atraso médio da borda", () => {
    const center: number[] = [];
    const edge: number[] = [];
    for (let i = 0; i < data.count; i++) {
      const x = Math.abs(data.order[i * 3]);
      const z = Math.abs(data.order[i * 3 + 2]);
      if (x < 5 && z < 4) center.push(data.delay[i]);
      if (x > 15) edge.push(data.delay[i]);
    }
    const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
    expect(avg(center)).toBeLessThan(avg(edge));
  });

  it("rng fica em [0, 1)", () => {
    const r = rng(1);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("stageUniforms", () => {
  it("topo do hero: caos livre, nada montado", () => {
    expect(stageUniforms(0)).toMatchObject({ drift: 1, pull: 0, assemble: 0, fill: 1, extrude: 0 });
  });

  it("fim da Solução: tudo encaixado, deriva parada", () => {
    const u = stageUniforms(0.6);
    expect(u.assemble).toBe(1);
    expect(u.drift).toBe(0);
    expect(u.fill).toBe(1);
  });

  it("Think: só contornos", () => {
    expect(stageUniforms(0.68).fill).toBe(0);
  });

  it("Develop: preenche e extruda", () => {
    const u = stageUniforms(0.8);
    expect(u.fill).toBe(1);
    expect(u.extrude).toBe(1);
  });

  it("Deliver e Repeat: sobe, ganha luz e pulsa", () => {
    expect(stageUniforms(0.9).lift).toBe(1);
    expect(stageUniforms(1).pulse).toBe(1);
  });

  it("todos os uniforms ficam em 0–1 e o progresso é limitado", () => {
    for (let p = -0.2; p <= 1.2; p += 0.01) {
      for (const v of Object.values(stageUniforms(p))) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("etapas vêm do content.ts", () => {
    expect(stepRanges.think).toEqual([0.6, 0.7]);
    expect(activeStep(0.2)).toBeNull();
    expect(activeStep(0.65)).toBe("think");
    expect(activeStep(0.75)).toBe("develop");
    expect(activeStep(0.85)).toBe("deliver");
    expect(activeStep(1)).toBe("repeat");
  });
});

describe("parseCssColor", () => {
  it.each([
    ["#1a1a1a", [26 / 255, 26 / 255, 26 / 255, 1]],
    ["#BAE6FD", [186 / 255, 230 / 255, 253 / 255, 1]],
    ["#fff", [1, 1, 1, 1]],
    ["#ffffff0f", [1, 1, 1, 15 / 255]],
    ["rgb(255 255 255 / 0.06)", [1, 1, 1, 0.06]],
    ["rgba(186, 230, 253, 0.45)", [186 / 255, 230 / 255, 253 / 255, 0.45]],
    ["rgb(255 255 255 / 12%)", [1, 1, 1, 0.12]],
  ])("%s", (input, [r, g, b, a]) => {
    const c = parseCssColor(input);
    expect(c).not.toBeNull();
    expect(c!.r).toBeCloseTo(r);
    expect(c!.g).toBeCloseTo(g);
    expect(c!.b).toBeCloseTo(b);
    expect(c!.a).toBeCloseTo(a);
  });

  it("rejeita o que não reconhece", () => {
    expect(parseCssColor("var(--x)")).toBeNull();
    expect(parseCssColor("")).toBeNull();
  });

  it("compõe sobre o fundo", () => {
    const [r] = over({ r: 1, g: 1, b: 1, a: 0.5 }, { r: 0, g: 0, b: 0, a: 1 });
    expect(r).toBeCloseTo(0.5);
  });
});

describe("qualidade", () => {
  const base: DeviceSignals = {
    webgl2: true,
    reducedMotion: false,
    saveData: false,
    deviceMemory: 8,
    hardwareConcurrency: 8,
    coarsePointer: false,
    viewportWidth: 1440,
  };

  it.each<[Partial<DeviceSignals>, string]>([
    [{}, "high"],
    [{ coarsePointer: true }, "medium"],
    [{ viewportWidth: 390 }, "medium"],
    [{ hardwareConcurrency: 4 }, "medium"],
    [{ deviceMemory: undefined, hardwareConcurrency: undefined }, "high"],
    [{ reducedMotion: true }, "static"],
    [{ webgl2: false }, "static"],
    [{ saveData: true }, "static"],
    [{ deviceMemory: 2 }, "static"],
  ])("%o → %s", (patch, tier) => {
    expect(initialTier({ ...base, ...patch }).tier).toBe(tier);
  });

  it("reduced-motion vence qualquer outro sinal", () => {
    expect(initialTier({ ...base, reducedMotion: true, webgl2: false }).reason).toBe(
      "reduced-motion",
    );
  });

  const run = (m: FpsMonitor, fps: number, seconds: number, t0 = 0) => {
    let verdict = "keep";
    const step = 1000 / fps;
    let t = t0;
    for (; t < t0 + seconds * 1000; t += step) {
      if (m.tick(t) === "downgrade") verdict = "downgrade";
    }
    return { verdict, t };
  };

  it("FPS alto não rebaixa", () => {
    expect(run(new FpsMonitor(45, 2), 60, 10).verdict).toBe("keep");
  });

  it("FPS baixo persistente rebaixa depois do aquecimento", () => {
    const m = new FpsMonitor(45, 2);
    expect(run(m, 20, 2.5).verdict).toBe("keep"); // ainda no aquecimento + 1ª janela
    expect(run(m, 20, 3, 2500).verdict).toBe("downgrade");
  });

  it("uma janela lenta isolada não rebaixa", () => {
    const m = new FpsMonitor(45, 2);
    let { t } = run(m, 60, 3);
    ({ t } = run(m, 20, 1.05, t));
    expect(run(m, 60, 3, t).verdict).toBe("keep");
  });

  it("cadeia de tiers", () => {
    expect(nextTier("high")).toBe("medium");
    expect(nextTier("medium")).toBe("static");
  });
});

describe("over", () => {
  it("cor opaca não muda", () => {
    expect(over({ r: 0.2, g: 0.3, b: 0.4, a: 1 }, { r: 0, g: 0, b: 0, a: 1 })).toEqual([
      0.2, 0.3, 0.4,
    ]);
  });
});
