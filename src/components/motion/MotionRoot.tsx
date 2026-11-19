"use client";

/**
 * Raiz do motion (decisions §5). No bundle inicial só fica o observer das
 * revelações (leve). GSAP, ScrollTrigger e Lenis vêm num chunk próprio depois
 * de `load` + ocioso, como o 3D.
 *
 * Revelação: elementos com `data-reveal` sobem 24px e aparecem quando entram
 * na tela; `data-reveal="mask"` abre com máscara horizontal. O stagger vem de
 * `--reveal-i` (índice) × `--stagger`. O H1 nunca usa `data-reveal` (LCP).
 */

import { useEffect } from "react";
import { afterLoadAndIdle } from "@/lib/idle";

export function MotionRoot() {
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-motion-ready", "");

    // Revela o que entrou na tela OU já ficou para trás (pulo por âncora,
    // rolagem rápida): nada fica escondido acima do viewport. Poucos elementos,
    // checados uma vez por frame de scroll e removidos da lista ao revelar.
    let pending = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])"),
    );
    let queued = 0;
    const check = () => {
      queued = 0;
      const line = innerHeight * 0.9;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top > line) return true;
        el.setAttribute("data-revealed", "");
        return false;
      });
      if (pending.length === 0) removeEventListener("scroll", onScroll);
    };
    const onScroll = () => {
      if (!queued) queued = requestAnimationFrame(check);
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    check();

    let dispose: (() => void) | undefined;
    let cancelled = false;
    const cancelIdle = afterLoadAndIdle(() => {
      import("./choreography-runtime").then((m) => {
        if (!cancelled) dispose = m.startChoreography();
      });
    });

    return () => {
      cancelled = true;
      cancelIdle();
      cancelAnimationFrame(queued);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      dispose?.();
    };
  }, []);

  return null;
}
