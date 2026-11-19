import { describe, expect, it } from "vitest";
import { content, howItWorks, review, sectionIds } from "./content";
import { isPlaceholder } from "./types";

/** Percorre o conteúdo e devolve [caminho, string] de cada texto (ignora placeholders). */
function strings(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (isPlaceholder(value) || value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k));
}

function resolve(path: string): unknown {
  return path.split(".").reduce<unknown>((obj, key) => {
    if (obj && typeof obj === "object" && key in obj) return (obj as Record<string, unknown>)[key];
    return undefined;
  }, content);
}

const all = strings(content);
const ids = new Set<string>(Object.values(sectionIds));

describe("content", () => {
  it("ids de seção são únicos", () => {
    expect(ids.size).toBe(Object.values(sectionIds).length);
  });

  it("toda âncora interna aponta para um id existente", () => {
    const anchors = all.filter(([, s]) => /^#/.test(s));
    expect(anchors.length).toBeGreaterThan(0);
    for (const [path, href] of anchors) {
      expect(ids.has(href.slice(1)), `${path} → ${href}`).toBe(true);
    }
  });

  it("erros de digitação do site original não voltam", () => {
    for (const [path, s] of all) {
      expect(s, path).not.toMatch(/sincroização|nosos|sistemas de internos|Software as a service/);
    }
  });

  it("nenhum número inventado: só aparecem os números do site original", () => {
    // Permitidos: 80 (Florestcon), 500 (limite do formulário), dados do WhatsApp e URLs.
    const allowed = new Set(["80", "500"]);
    for (const [path, s] of all) {
      if (/^https?:|^#/.test(s) || path.startsWith("site.whatsapp")) continue;
      for (const n of s.match(/\d+/g) ?? []) {
        expect(allowed.has(n), `${path}: "${s}"`).toBe(true);
      }
    }
  });

  it("as etapas cobrem o trecho 0,6 → 1 da cena sem buracos", () => {
    const ranges = howItWorks.steps.map((s) => s.range);
    expect(ranges[0][0]).toBe(0.6);
    expect(ranges.at(-1)?.[1]).toBe(1);
    for (let i = 1; i < ranges.length; i++) expect(ranges[i][0]).toBe(ranges[i - 1][1]);
  });

  it("todo item da fila de revisão aponta para um caminho existente", () => {
    for (const item of review) {
      expect(resolve(item.path), item.path).not.toBeUndefined();
    }
  });

  it("o print do G Training continua bloqueante enquanto for placeholder", () => {
    const img = content.cases.items[1].image;
    if (isPlaceholder(img)) {
      expect(review.some((r) => r.path === "cases.items.1.image" && r.blocking)).toBe(true);
    }
  });
});
