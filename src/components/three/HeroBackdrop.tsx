"use client";

/**
 * Fundo do hero (decisions §2.4 e §2.5). Fica no bundle inicial e é leve:
 *
 * 1. O grid em CSS, com a mesma perspectiva da câmera 3D, aparece no HTML
 *    estático (antes de qualquer JS).
 * 2. Depois de `load` + ocioso, decide o tier. Se o aparelho aguenta, importa
 *    o chunk 3D e faz crossfade quando o primeiro frame é desenhado.
 * 3. Sem WebGL, com saveData, pouca memória, reduced-motion ou FPS < 30
 *    persistente: imagem estática do estado ordenado, renderizada da própria cena.
 *
 * O canvas é decorativo (aria-hidden); tudo o que a cena "diz" está no texto.
 */

import { type ComponentType, useCallback, useEffect, useState } from "react";
import { afterLoadAndIdle } from "@/lib/idle";
import { camera } from "./config";
import type { Tier } from "./config";
import { sceneControls, setSceneProgress } from "./controls";
import type { ActiveTier, HeroCanvasProps } from "./HeroCanvas";
import { initialTier, readDeviceSignals } from "./quality";

type Mode = { kind: "normal" } | { kind: "capture"; tier: ActiveTier } | { kind: "debug" };

function readMode(): Mode {
  const params = new URLSearchParams(location.search);
  const scene = params.get("scene");
  if (scene === "capture") {
    setSceneProgress(Number(params.get("p") ?? 0.85));
    sceneControls.frozenTime = Number(params.get("t") ?? 0);
    sceneControls.pointerEnabled = false;
    document.documentElement.dataset.sceneCapture = "";
    return { kind: "capture", tier: params.get("tier") === "medium" ? "medium" : "high" };
  }
  if (scene === "debug") {
    if (params.get("fps") === "off") sceneControls.adaptive = false;
    // inspeção pelos scripts de verificação e pelo console
    (window as unknown as { __sceneControls: typeof sceneControls }).__sceneControls =
      sceneControls;
    return { kind: "debug" };
  }
  return { kind: "normal" };
}

/** Loop ligado só com a aba visível e algum trecho `[data-scene-range]` na tela. */
function useSceneActive(enabled: boolean) {
  const [active, setActive] = useState(true);
  useEffect(() => {
    if (!enabled) return;
    const visible = new Set<Element>();
    let inView = true;
    const update = () => setActive(inView && document.visibilityState === "visible");

    const ranges = document.querySelectorAll("[data-scene-range]");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      inView = ranges.length === 0 || visible.size > 0;
      update();
    });
    ranges.forEach((el) => io.observe(el));
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [enabled]);
  return active;
}

export function HeroBackdrop() {
  const [tier, setTier] = useState<Tier | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "normal" });
  const [Canvas, setCanvas] = useState<ComponentType<HeroCanvasProps> | null>(null);
  const [ready, setReady] = useState(false);
  const [Debug, setDebug] = useState<ComponentType | null>(null);

  // 1. Tier inicial e modo (captura/debug)
  // A detecção só existe no cliente (URL, matchMedia, WebGL); decidir uma vez
  // na montagem é o objetivo deste efeito, e o HTML estático não depende dele.
  useEffect(() => {
    const m = readMode();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(m);
    if (m.kind === "capture") {
      setTier(m.tier);
      return;
    }
    setTier(initialTier(readDeviceSignals()).tier);

    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => reduced.matches && setTier("static");
    reduced.addEventListener("change", onChange);
    return () => reduced.removeEventListener("change", onChange);
  }, []);

  // 2. Chunk 3D depois de load + ocioso (na captura, imediatamente)
  const wants3d = tier === "high" || tier === "medium";
  useEffect(() => {
    if (!wants3d || Canvas) return;
    const load = () =>
      import("./HeroCanvas").then((m) => setCanvas(() => m.default)).catch(() => setTier("static"));
    if (mode.kind === "capture") {
      load();
      return;
    }
    return afterLoadAndIdle(load);
  }, [wants3d, Canvas, mode.kind]);

  // Painel de debug só com ?scene=debug (chunk próprio)
  useEffect(() => {
    if (mode.kind !== "debug") return;
    import("./SceneDebug").then((m) => setDebug(() => m.SceneDebug));
  }, [mode.kind]);

  const active = useSceneActive(wants3d && mode.kind !== "capture");

  const onReady = useCallback(() => {
    setReady(true);
    if (mode.kind === "capture") {
      // sinal para o script que gera a imagem de fallback
      requestAnimationFrame(() => (document.documentElement.dataset.sceneReady = ""));
    }
  }, [mode.kind]);

  const onDowngrade = useCallback((next: Tier) => {
    setReady(false);
    setTier(next);
  }, []);

  const showCanvas = wants3d && Canvas;
  const isStatic = tier === "static";

  return (
    <>
      <div
        className="scene-backdrop"
        data-tier={tier ?? "pending"}
        data-ready={ready ? "" : undefined}
        aria-hidden="true"
        style={
          {
            "--scene-half-fov": `${camera.fov / 2}deg`,
            "--scene-tilt": `${90 - camera.elevation}deg`,
          } as React.CSSProperties
        }
      >
        <div className="scene-grid" />

        {/* Estado ordenado, renderizado da própria cena (scripts/render-scene-fallback.mjs).
          Visível por CSS com reduced-motion, mesmo sem JS. */}
        <picture className="scene-fallback" data-visible={isStatic ? "" : undefined}>
          <source
            media="(orientation: portrait)"
            type="image/avif"
            srcSet="/images/hero/scene-portrait.avif"
          />
          <source
            media="(orientation: portrait)"
            type="image/webp"
            srcSet="/images/hero/scene-portrait.webp"
          />
          <source type="image/avif" srcSet="/images/hero/scene-landscape.avif" />
          <source type="image/webp" srcSet="/images/hero/scene-landscape.webp" />
          <img
            src="/images/hero/scene-landscape.webp"
            alt=""
            width={1920}
            height={1080}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />
        </picture>

        {showCanvas && (
          <div className="scene-canvas">
            <Canvas
              key={tier}
              tier={tier}
              active={mode.kind === "capture" || active}
              onReady={onReady}
              onDowngrade={onDowngrade}
              capture={mode.kind === "capture"}
            />
          </div>
        )}
      </div>
      {Debug && <Debug />}
    </>
  );
}
