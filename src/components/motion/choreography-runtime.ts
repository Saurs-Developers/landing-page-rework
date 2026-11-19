/**
 * Coreografia de scroll (decisions §2.1 e §5). Raiz de um chunk próprio,
 * importado pelo MotionRoot depois de `load` + ocioso.
 *
 * Um único relógio: o gsap.ticker roda, nesta ordem, o Lenis (que dispara o
 * ScrollTrigger), e depois a cena 3D (via setFrameDriver). Sem dois laços de
 * rAF disputando o mesmo frame.
 *
 * Com reduced-motion: sem Lenis e sem efeito magnético. Progresso da cena,
 * etapa ativa e barra continuam (são posição, não animação), e o fallback já
 * é a imagem estática.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  type FrameDriver,
  type Tick,
  createRafDriver,
  setFrameDriver,
  setSceneProgress,
} from "@/components/three/controls";
import { activeStep } from "@/components/three/stages";
import { howItWorks } from "@/content/content";
import { gsapEase, readDuration, readLength } from "@/lib/tokens";
import {
  buildKeyframes,
  type Keyframe,
  measureLayout,
  progressAt,
  selectors,
} from "./choreography";

gsap.registerPlugin(ScrollTrigger);

const SCROLLED_AT = 80; // px até o header ganhar fundo (decisions §3.1)

function gsapDriver(): FrameDriver {
  const wrapped = new Map<Tick, () => void>();
  return {
    add(tick) {
      const fn = () => tick(performance.now());
      wrapped.set(tick, fn);
      gsap.ticker.add(fn);
    },
    remove(tick) {
      const fn = wrapped.get(tick);
      if (fn) gsap.ticker.remove(fn);
      wrapped.delete(tick);
    },
  };
}

export function startChoreography(): () => void {
  const html = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const cleanups: (() => void)[] = [];
  const triggers: ScrollTrigger[] = [];

  /* 1. Lenis + relógio único ------------------------------------------ */
  let lenis: Lenis | null = null;
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.1, autoRaf: false, anchors: false });
    lenis.on("scroll", ScrollTrigger.update);
  }
  const lenisTick = () => lenis?.raf(performance.now());
  gsap.ticker.add(lenisTick);
  gsap.ticker.lagSmoothing(0);
  setFrameDriver(gsapDriver()); // a cena entra depois do Lenis no mesmo tick
  cleanups.push(() => {
    setFrameDriver(createRafDriver());
    gsap.ticker.remove(lenisTick);
    lenis?.destroy();
  });

  /* 2. Progresso da cena + etapa ativa + header com fundo após 80px ---- */
  let frames: Keyframe[] = [];
  const steps = howItWorks.steps.map((s) => ({
    key: s.key,
    el: document.querySelector<HTMLElement>(selectors.step(s.key)),
  }));
  let currentStep: string | null = null;

  const applyProgress = (scroll: number) => {
    html.toggleAttribute("data-scrolled", scroll > SCROLLED_AT);
    const p = progressAt(scroll, frames);
    setSceneProgress(p);
    const step = activeStep(p);
    if (step === currentStep) return;
    currentStep = step;
    if (step) html.dataset.sceneStep = step;
    else delete html.dataset.sceneStep;
    for (const s of steps) s.el?.toggleAttribute("data-active", s.key === step);
  };

  const remeasure = () => {
    const layout = measureLayout();
    frames = layout ? buildKeyframes(layout) : [];
    applyProgress(scrollY);
  };
  ScrollTrigger.addEventListener("refresh", remeasure);
  cleanups.push(() => ScrollTrigger.removeEventListener("refresh", remeasure));

  triggers.push(
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => applyProgress(self.scroll()),
    }),
  );

  /* 3. Barra vertical de "Como funciona" ------------------------------ */
  const fill = document.querySelector<HTMLElement>("[data-steps-fill]");
  const first = steps[0]?.el;
  const last = steps.at(-1)?.el;
  if (fill && first && last) {
    triggers.push(
      ScrollTrigger.create({
        trigger: first,
        start: "top center",
        endTrigger: last,
        end: "bottom center",
        onUpdate: (self) => (fill.style.scale = `1 ${self.progress.toFixed(4)}`),
        onRefresh: (self) => (fill.style.scale = `1 ${self.progress.toFixed(4)}`),
      }),
    );
  }

  /* 4. A cena sai depois de "Como funciona" --------------------------- */
  const backdrop = document.querySelector<HTMLElement>(".scene-backdrop");
  const how = document.querySelector(selectors.howItWorks);
  if (backdrop && how) {
    const setOpacity = (p: number) => (backdrop.style.opacity = String(1 - p));
    triggers.push(
      ScrollTrigger.create({
        trigger: how,
        start: "bottom 60%",
        end: "bottom 10%",
        onUpdate: (self) => setOpacity(self.progress),
        onRefresh: (self) => setOpacity(self.progress),
      }),
    );
    cleanups.push(() => backdrop.style.removeProperty("opacity"));
  }

  /* 6. Âncoras: rolagem suave, foco no destino, destaque de 1,2 s ------ */
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    const id = link?.getAttribute("href")?.slice(1);
    const target = id ? document.getElementById(decodeURIComponent(id)) : null;
    if (!target) return;
    e.preventDefault();

    const arrive = () => {
      if (!target.matches("a, button, input, select, textarea, [tabindex]")) {
        target.setAttribute("tabindex", "-1");
      }
      target.focus({ preventScroll: true });
      history.pushState(null, "", `#${id}`);
      if (target.hasAttribute("data-highlight-on-arrival")) {
        target.setAttribute("data-highlighted", "");
        window.setTimeout(
          () => target.removeAttribute("data-highlighted"),
          readDuration("--dur-highlight") * 1000,
        );
      }
    };

    // scroll-margin-top (globals.css) já desconta o header: o Lenis e o
    // scrollIntoView respeitam a margem sozinhos.
    if (lenis) {
      lenis.scrollTo(target, { onComplete: arrive });
    } else {
      target.scrollIntoView({ block: "start" });
      arrive();
    }
  };
  document.addEventListener("click", onClick);
  cleanups.push(() => document.removeEventListener("click", onClick));

  /* 7. CTA magnético (desktop, sem reduced-motion) -------------------- */
  if (!reduced && finePointer) {
    const max = readLength("--magnetic-max") || 6;
    const duration = readDuration("--dur-slow");
    document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
      const toX = gsap.quickTo(el, "x", { duration, ease: gsapEase["--ease-out-expo"] });
      const toY = gsap.quickTo(el, "y", { duration, ease: gsapEase["--ease-out-expo"] });
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        toX(Math.max(-1, Math.min(1, dx)) * max);
        toY(Math.max(-1, Math.min(1, dy)) * max);
      };
      const leave = () => {
        toX(0);
        toY(0);
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
        gsap.set(el, { clearProps: "transform" });
      });
    });
  }

  /* Medidas finais: fontes podem mudar alturas */
  html.setAttribute("data-choreography", "");
  remeasure();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return () => {
    triggers.forEach((t) => t.kill());
    cleanups.forEach((fn) => fn());
    html.removeAttribute("data-choreography");
    html.removeAttribute("data-scrolled");
    delete html.dataset.sceneStep;
  };
}
