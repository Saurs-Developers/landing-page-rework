"use client";

/**
 * Painel de desenvolvimento, só com `?scene=debug`. Permite percorrer a
 * narrativa sem a coreografia de scroll (que chega na Fase 3c).
 * Ferramenta interna: o texto daqui não é copy da página.
 */

import { useEffect, useState } from "react";
import { howItWorks } from "@/content/content";
import { sceneControls, setSceneProgress } from "./controls";
import { activeStep } from "./stages";

const marks = [
  { label: "Hero", p: 0 },
  { label: "Problema", p: 0.3 },
  { label: "Solução", p: 0.6 },
  ...howItWorks.steps.map((s) => ({ label: s.motto, p: (s.range[0] + s.range[1]) / 2 })),
];

export function SceneDebug() {
  const [progress, setProgress] = useState(sceneControls.progress);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let id = 0;
    const loop = (now: number) => {
      frames++;
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  const set = (p: number) => {
    setSceneProgress(p);
    setProgress(p);
  };

  const tier = document.querySelector<HTMLElement>(".scene-backdrop")?.dataset.tier;

  return (
    <div className="fixed right-3 bottom-3 z-(--z-overlay) w-80 rounded-lg border border-border bg-surface p-4 text-sm text-text shadow-raised">
      <div className="mb-2 flex justify-between font-display">
        <span>cena · {tier}</span>
        <span>{fps} fps</span>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-text-muted">
          progresso {progress.toFixed(3)} · etapa {activeStep(progress) ?? "—"}
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          onChange={(e) => set(Number(e.target.value))}
          className="accent-brand"
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-1">
        {marks.map((m) => (
          <button
            key={m.label}
            type="button"
            onClick={() => set(m.p)}
            className="rounded-sm border border-border px-2 py-1 text-xs hover:border-brand-line"
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
