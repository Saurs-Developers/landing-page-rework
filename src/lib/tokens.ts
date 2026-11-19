/**
 * Ponte entre src/styles/tokens.css e o JavaScript (GSAP, cena 3D).
 *
 * Os valores NÃO são duplicados aqui: o CSS é a fonte única e o JS lê as
 * variáveis em tempo de execução. Este arquivo só guarda os NOMES, tipados,
 * e um teste (tokens.test.ts) garante que todo nome listado existe no CSS.
 */

export const colorTokens = [
  "--color-bg",
  "--color-bg-deep",
  "--color-surface",
  "--color-surface-raised",
  "--color-text",
  "--color-text-muted",
  "--color-brand",
  "--color-brand-hover",
  "--color-brand-line",
  "--color-grid-line",
  "--color-grid-dot",
] as const;

export const durationTokens = [
  "--dur-instant",
  "--dur-fast",
  "--dur-base",
  "--dur-slow",
  "--dur-slower",
  "--dur-scene",
  "--dur-crossfade",
  "--dur-highlight",
  "--stagger",
] as const;

export const sizeTokens = ["--grid-cell", "--magnetic-max"] as const;

export type ColorToken = (typeof colorTokens)[number];
export type DurationToken = (typeof durationTokens)[number];
export type SizeToken = (typeof sizeTokens)[number];
export type Token = ColorToken | DurationToken | SizeToken;

/** Equivalentes GSAP das curvas CSS (decisions §6.3). */
export const gsapEase = {
  "--ease-standard": "power2.out",
  "--ease-out-expo": "expo.out",
  "--ease-in-out": "power3.inOut",
} as const;

export type EaseToken = keyof typeof gsapEase;

/** Lê o valor bruto de um token em :root. Só no cliente. */
export function readToken(name: Token, el: Element = document.documentElement): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/** Converte "480ms" ou "0.48s" em segundos (unidade do GSAP). */
export function parseDuration(value: string): number {
  const v = value.trim();
  if (v.endsWith("ms")) return Number.parseFloat(v) / 1000;
  if (v.endsWith("s")) return Number.parseFloat(v);
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n / 1000 : 0;
}

/** Duração de um token em segundos, já respeitando prefers-reduced-motion. */
export function readDuration(name: DurationToken): number {
  return parseDuration(readToken(name));
}

/** Converte "3.5rem" / "56px" em pixels, usando o font-size raiz. */
export function readLength(name: SizeToken): number {
  const raw = readToken(name);
  const n = Number.parseFloat(raw);
  if (raw.endsWith("rem")) {
    return n * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  }
  return n;
}
