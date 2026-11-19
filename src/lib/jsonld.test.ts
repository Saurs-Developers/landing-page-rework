import { describe, expect, it } from "vitest";
import { buildJsonLd, serializeJsonLd } from "./jsonld";

describe("buildJsonLd", () => {
  const graph = buildJsonLd()["@graph"];

  it("descreve a empresa com o WhatsApp como contato", () => {
    const org = graph[0] as Record<string, unknown>;
    expect(org["@type"]).toContain("ProfessionalService");
    expect(org.areaServed).toBe("BR");
    expect(JSON.stringify(org.contactPoint)).toContain("+55 83 99335-8558");
  });

  it("não publica placeholders (endereço, redes, logo, e-mail)", () => {
    const text = serializeJsonLd(buildJsonLd());
    expect(text).not.toContain("placeholder");
    expect(text).not.toContain("PostalAddress");
    expect(text).not.toContain("sameAs");
    expect(text).not.toContain('"logo"');
  });

  it("FAQPage só tem perguntas com resposta real", () => {
    const faq = graph.find((n) => (n as { "@type": string })["@type"] === "FAQPage") as {
      mainEntity: { acceptedAnswer: { text: string } }[];
    };
    expect(faq.mainEntity.length).toBeGreaterThan(0);
    for (const q of faq.mainEntity) expect(q.acceptedAnswer.text.length).toBeGreaterThan(0);
  });
});

describe("serializeJsonLd", () => {
  it("escapa < para não fechar o script", () => {
    expect(serializeJsonLd({ a: "</script>" })).not.toContain("</script>");
  });
});
