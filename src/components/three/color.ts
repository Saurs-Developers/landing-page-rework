/**
 * Converte o valor de um token de cor (como o navegador devolve em
 * getComputedStyle) em componentes 0–1 para os shaders.
 *
 * O minificador de CSS pode reescrever `rgb(255 255 255 / 0.06)` como
 * `#ffffff0f`, então aceitamos hex de 3/4/6/8 dígitos e rgb()/rgba() com
 * vírgulas ou espaços. A cena trabalha em sRGB direto (sem gestão de cor do
 * three), para o fundo do canvas bater exatamente com o `--color-bg` do CSS.
 */

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNC = /^rgba?\(\s*([^)]+)\)$/i;

function channel(value: string, max = 255): number {
  const v = value.trim();
  if (v.endsWith("%")) return Math.min(1, Math.max(0, Number.parseFloat(v) / 100));
  return Math.min(1, Math.max(0, Number.parseFloat(v) / max));
}

export function parseCssColor(input: string): Rgba | null {
  const value = input.trim().toLowerCase();

  const hex = HEX.exec(value);
  if (hex) {
    let h = hex[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    const n = (i: number) => Number.parseInt(h.slice(i, i + 2), 16) / 255;
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 };
  }

  const fn = FUNC.exec(value);
  if (fn) {
    const [rgbPart, alphaPart] = fn[1].split("/");
    const parts = rgbPart.split(/[\s,]+/).filter(Boolean);
    let alpha: string | undefined = alphaPart;
    if (!alpha && parts.length === 4) alpha = parts.pop();
    if (parts.length !== 3) return null;
    const [r, g, b] = parts.map((p) => channel(p));
    if ([r, g, b].some(Number.isNaN)) return null;
    const a = alpha === undefined ? 1 : channel(alpha, 1);
    return { r, g, b, a: Number.isNaN(a) ? 1 : a };
  }

  return null;
}

/** Compõe uma cor translúcida sobre um fundo opaco (resultado opaco, sRGB). */
export function over(top: Rgba, bottom: Rgba): [number, number, number] {
  return [
    top.r * top.a + bottom.r * (1 - top.a),
    top.g * top.a + bottom.g * (1 - top.a),
    top.b * top.a + bottom.b * (1 - top.a),
  ];
}
