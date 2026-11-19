"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { header, sectionIds } from "@/content/content";

/**
 * 3.1 Header. Fixo; ganha fundo com `html[data-scrolled]` (globals.css, ligado
 * pela coreografia depois de 80 px). Menu móvel é um disclosure simples:
 * botão com aria-expanded, Escape fecha e devolve o foco, clique num link fecha.
 */
export function Header() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className="site-header fixed inset-x-0 top-0 z-(--z-header)"
      data-open={open || undefined}
    >
      <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-6 px-gutter md:h-20">
        <a
          href={`#${sectionIds.hero}`}
          aria-label={header.logoLabel}
          className="font-display text-xl font-bold tracking-eyebrow text-text uppercase"
        >
          Saurs
        </a>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {header.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-text-muted transition-colors duration-(--dur-fast) ease-standard hover:text-text"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <ButtonLink link={header.cta} className="px-5 py-2 text-sm" />
          </div>
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-11 items-center justify-center rounded-md border border-border-strong text-text md:hidden"
          >
            <span className="sr-only">{open ? header.menuLabel.close : header.menuLabel.open}</span>
            <span aria-hidden="true" className="menu-icon" />
          </button>
        </div>
      </div>

      <div id={panelId} hidden={!open} className="site-header-panel md:hidden">
        <nav aria-label="Principal (menu)" className="mx-auto max-w-page px-gutter pt-2 pb-6">
          <ul className="flex flex-col">
            {header.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-border py-4 text-lg text-text"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <ButtonLink link={header.cta} className="mt-6 w-full" />
        </nav>
      </div>
    </header>
  );
}
