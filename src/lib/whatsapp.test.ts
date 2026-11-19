import { describe, expect, it } from "vitest";
import {
  DEFAULT_MESSAGE,
  MESSAGE_MAX_LENGTH,
  buildLeadMessage,
  isProjectTypeId,
  validateLead,
  whatsappUrl,
} from "./whatsapp";

describe("buildLeadMessage", () => {
  it("usa a mensagem padrão sem dados", () => {
    expect(buildLeadMessage({})).toBe(DEFAULT_MESSAGE);
    expect(buildLeadMessage({ name: "   ", message: "\n" })).toBe(DEFAULT_MESSAGE);
  });

  it("monta a frase completa", () => {
    expect(
      buildLeadMessage({
        name: "Ana",
        projectType: "aplicativo",
        message: "App para minha equipe",
      }),
    ).toBe("Olá, Saurs! Sou Ana. Tenho interesse em um aplicativo. App para minha equipe.");
  });

  it("não duplica a pontuação final", () => {
    expect(buildLeadMessage({ name: "Ana", message: "Dá para começar em março?" })).toBe(
      "Olá, Saurs! Sou Ana. Dá para começar em março?",
    );
  });

  it("trata 'Ainda não sei' com frase própria", () => {
    expect(buildLeadMessage({ name: "Rui", projectType: "nao-sei" })).toBe(
      "Olá, Saurs! Sou Rui. Ainda não sei qual tipo de projeto preciso.",
    );
  });

  it("colapsa espaços e quebras de linha", () => {
    expect(buildLeadMessage({ name: "  Ana   Lima ", message: "linha 1\n\nlinha 2" })).toBe(
      "Olá, Saurs! Sou Ana Lima. linha 1 linha 2.",
    );
  });

  it("limita a mensagem a 500 caracteres", () => {
    const out = buildLeadMessage({ message: "a".repeat(800) });
    expect(out).toBe(`Olá, Saurs! ${"a".repeat(MESSAGE_MAX_LENGTH)}.`);
  });
});

describe("whatsappUrl", () => {
  it("codifica o texto para a URL", () => {
    const url = whatsappUrl("Olá, Saurs! Sou Ana & Cia. 50% pronto?");
    expect(url.startsWith("https://wa.me/5583993358558?text=")).toBe(true);
    const text = new URL(url).searchParams.get("text");
    expect(text).toBe("Olá, Saurs! Sou Ana & Cia. 50% pronto?");
  });

  it("usa a mensagem padrão por omissão", () => {
    expect(new URL(whatsappUrl()).searchParams.get("text")).toBe(DEFAULT_MESSAGE);
  });
});

describe("isProjectTypeId", () => {
  it("valida ids conhecidos", () => {
    expect(isProjectTypeId("saas")).toBe(true);
    expect(isProjectTypeId("blog")).toBe(false);
  });
});

describe("validateLead", () => {
  it("exige só o nome", () => {
    expect(validateLead({})).toEqual({ name: "empty" });
    expect(validateLead({ name: "  \n " })).toEqual({ name: "empty" });
    expect(validateLead({ name: "Ana" })).toEqual({});
  });
});
