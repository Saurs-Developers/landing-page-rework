"use client";

/**
 * Canvas WebGL do hero (decisions §2). Carregado sob demanda pelo HeroBackdrop,
 * fora do bundle inicial: este arquivo é a raiz do chunk 3D.
 *
 * three puro, sem React Three Fiber: o R3F importa o three inteiro
 * (`extend(THREE)`) e o chunk passava de 240 KB gzip, contra a meta de 180 KB
 * do decisions §2.4. A cena tem só duas malhas e um loop; o wrapper abaixo
 * cobre isso. A lógica por frame vive em runtime.ts.
 */

import { useEffect, useRef } from "react";
import {
  ColorManagement,
  InstancedMesh,
  LinearSRGBColorSpace,
  Mesh,
  NoToneMapping,
  PerspectiveCamera,
  Scene,
  Timer,
  WebGLRenderer,
} from "three";
import { readLength, readToken } from "@/lib/tokens";
import { over, parseCssColor, type Rgba } from "./color";
import { type Tier, camera, tiers } from "./config";
import { onFrame, sceneControls } from "./controls";
import { monitorFor, nextTier } from "./quality";
import { type SceneColors, SceneRuntime, type Vec3 } from "./runtime";

// Cores dos tokens vão direto para o shader, em sRGB, sem conversão.
ColorManagement.enabled = false;

const FALLBACK: Rgba = { r: 0.1, g: 0.1, b: 0.1, a: 1 };

function readColors(): SceneColors {
  const get = (name: Parameters<typeof readToken>[0]) => parseCssColor(readToken(name)) ?? FALLBACK;
  const bg = get("--color-bg");
  const rgb = (c: Rgba): Vec3 => over(c, bg);
  return {
    bg: rgb(bg),
    face: rgb(get("--color-surface")),
    faceTop: rgb(get("--color-surface-raised")),
    brand: rgb(get("--color-brand")),
    line: rgb(get("--color-grid-line")),
    dot: rgb(get("--color-grid-dot")),
  };
}

const toHex = ([r, g, b]: Vec3) =>
  (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);

export type ActiveTier = Exclude<Tier, "static">;

export interface HeroCanvasProps {
  tier: ActiveTier;
  /** Loop de render ligado (trecho visível e aba ativa). */
  active: boolean;
  /** Primeiro frame desenhado: hora do crossfade. */
  onReady: () => void;
  /** O monitor de FPS pediu para baixar a qualidade. */
  onDowngrade: (next: Tier) => void;
  /** Modo captura (imagem de fallback): sem monitor, tempo congelado. */
  capture?: boolean;
}

interface Engine {
  start: () => void;
  stop: () => void;
  dispose: () => void;
}

function createEngine(
  canvas: HTMLCanvasElement,
  tier: ActiveTier,
  capture: boolean,
  events: { ready: () => void; downgrade: () => void },
): Engine {
  const config = tiers[tier];
  const runtime = new SceneRuntime({
    config,
    colors: readColors(),
    cellPx: readLength("--grid-cell") || 56,
    capture,
    monitor: capture || !sceneControls.adaptive ? null : monitorFor(tier),
  });

  const renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: capture,
  });
  renderer.outputColorSpace = LinearSRGBColorSpace; // sem conversão: valores sRGB passam direto
  renderer.toneMapping = NoToneMapping;
  renderer.setClearColor(toHex(runtime.colors.bg), 1);

  const scene = new Scene();
  const cam = new PerspectiveCamera(camera.fov, 1, 1, 200);
  scene.add(new Mesh(runtime.gridGeometry, runtime.gridMaterial));
  const blocks = new InstancedMesh(runtime.blocksGeometry, runtime.blocksMaterial, runtime.count);
  blocks.frustumCulled = false;
  scene.add(blocks);

  let height = 0;
  const resize = () => {
    const parent = canvas.parentElement ?? canvas;
    const width = parent.clientWidth;
    height = parent.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, config.maxDpr));
    renderer.setSize(width, height, false);
    cam.aspect = width / Math.max(1, height);
    cam.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement ?? canvas);

  // Relógio único da página (controls.ts): rAF até o GSAP carregar, depois
  // gsap.ticker, no mesmo tick do Lenis e do ScrollTrigger.
  const timer = new Timer();
  let unsubscribe: (() => void) | null = null;
  const loop = (now: number) => {
    timer.update(now);
    const { ready, downgrade } = runtime.frame(cam, height, timer.getDelta());
    renderer.render(scene, cam);
    if (ready) events.ready();
    if (downgrade) events.downgrade();
  };

  const detachPointer = runtime.attachPointer();

  return {
    start() {
      if (unsubscribe) return;
      runtime.resume();
      timer.reset();
      unsubscribe = onFrame(loop);
    },
    stop() {
      unsubscribe?.();
      unsubscribe = null;
    },
    dispose() {
      unsubscribe?.();
      unsubscribe = null;
      ro.disconnect();
      detachPointer();
      runtime.dispose();
      renderer.dispose();
    },
  };
}

export default function HeroCanvas({
  tier,
  active,
  onReady,
  onDowngrade,
  capture = false,
}: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const callbacks = useRef({ onReady, onDowngrade });

  useEffect(() => {
    callbacks.current = { onReady, onDowngrade };
  }, [onReady, onDowngrade]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createEngine(canvas, tier, capture, {
      ready: () => callbacks.current.onReady(),
      downgrade: () => callbacks.current.onDowngrade(nextTier(tier)),
    });
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [tier, capture]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (active || capture) engine.start();
    else engine.stop();
  }, [active, capture, tier]);

  return <canvas ref={canvasRef} aria-hidden="true" tabIndex={-1} className="block size-full" />;
}
