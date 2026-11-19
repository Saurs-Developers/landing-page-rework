import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { colorTokens, durationTokens, gsapEase, parseDuration, sizeTokens } from "./tokens";

const css = readFileSync(join(__dirname, "../styles/tokens.css"), "utf8");
const declared = new Set([...css.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((m) => m[1]));

describe("tokens.ts × tokens.css", () => {
  it.each([...colorTokens, ...durationTokens, ...sizeTokens, ...Object.keys(gsapEase)])(
    "%s existe no CSS",
    (name) => {
      expect(declared.has(name)).toBe(true);
    },
  );

  it("não há valores literais de cor fora de tokens.css nos estilos globais", () => {
    const globals = readFileSync(join(__dirname, "../app/globals.css"), "utf8");
    expect(globals).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(|oklch\(/i);
  });
});

describe("parseDuration", () => {
  it.each([
    ["480ms", 0.48],
    ["1.2s", 1.2], // o minificador de CSS reescreve 1200ms como 1.2s
    [".15s", 0.15],
    ["0.3s", 0.3],
    ["0ms", 0],
    [" 150ms ", 0.15],
    ["", 0],
  ])("%s → %s", (input, expected) => {
    expect(parseDuration(input)).toBeCloseTo(expected);
  });
});
