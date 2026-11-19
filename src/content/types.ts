/**
 * Tipos do conteúdo da página.
 *
 * Regra do projeto: nenhum número, logo, depoimento ou fato é inventado.
 * O que só a Saurs pode fornecer entra como `Placeholder` e NÃO é renderizado
 * em produção (os componentes usam `isPlaceholder` para omitir o bloco).
 */

/** Status de cada texto em relação ao site original (decisions §3, legenda). */
export type CopyStatus =
  | "mantido" // texto original, sem alteração
  | "corrigido" // erro de digitação ou idioma corrigido
  | "movido" // texto original em outra posição
  | "alterado" // texto original reescrito
  | "novo" // copy novo, derivado de fatos do site
  | "validar" // afirmação plausível; a Saurs precisa confirmar
  | "placeholder"; // informação que só a Saurs pode fornecer

export interface Placeholder {
  readonly placeholder: string;
}

export const placeholder = (what: string): Placeholder => ({ placeholder: what });

export function isPlaceholder(value: unknown): value is Placeholder {
  return typeof value === "object" && value !== null && "placeholder" in value;
}

/** Valor real ou pendência da Saurs. */
export type Maybe<T> = T | Placeholder;

export interface Link {
  label: string;
  href: string;
  external?: boolean;
}

export interface ImageAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/** Item da fila de revisão com a Saurs (decisions §8). */
export interface ReviewItem {
  /** Caminho no objeto `content`, ex.: "howItWorks.steps.0.text". */
  path: string;
  status: Extract<CopyStatus, "validar" | "placeholder" | "corrigido">;
  note: string;
  /** Bloqueia a publicação até ser resolvido. */
  blocking?: boolean;
}
