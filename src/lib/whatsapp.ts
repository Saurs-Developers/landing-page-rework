/**
 * Monta links wa.me com mensagem pré-preenchida (decisions §3.2 e §3.10).
 * Sem backend e sem armazenamento: o "envio" é só abrir o WhatsApp.
 */

export const WHATSAPP_NUMBER = "5583993358558";
export const WHATSAPP_DISPLAY = "+55 83 99335-8558";

export const DEFAULT_MESSAGE = "Olá, Saurs! Vim pelo site e quero conversar sobre um projeto.";

export const MESSAGE_MAX_LENGTH = 500;
export const NAME_MAX_LENGTH = 80;

export const projectTypes = [
  { id: "site", label: "Site", phrase: "um site" },
  { id: "landing-page", label: "Landing page", phrase: "uma landing page" },
  { id: "saas", label: "SaaS", phrase: "um SaaS" },
  {
    id: "dashboard",
    label: "Dashboard ou sistema interno",
    phrase: "um dashboard ou sistema interno",
  },
  { id: "aplicativo", label: "Aplicativo", phrase: "um aplicativo" },
  { id: "e-commerce", label: "E-commerce", phrase: "um e-commerce" },
  {
    id: "melhorar-sistema",
    label: "Melhorar um sistema que já tenho",
    phrase: "melhorar um sistema que já tenho",
  },
  { id: "nao-sei", label: "Ainda não sei", phrase: null },
] as const;

export type ProjectTypeId = (typeof projectTypes)[number]["id"];

export function isProjectTypeId(value: string): value is ProjectTypeId {
  return projectTypes.some((t) => t.id === value);
}

/** Colapsa espaços/linhas e corta no limite, sem quebrar no meio de um emoji. */
function clean(value: string | undefined, max: number): string {
  if (!value) return "";
  const collapsed = value.replace(/\s+/g, " ").trim();
  return Array.from(collapsed).slice(0, max).join("").trim();
}

export interface LeadMessageInput {
  name?: string;
  projectType?: ProjectTypeId;
  message?: string;
}

/**
 * "Olá, Saurs! Sou {nome}. Tenho interesse em {tipo}. {mensagem}"
 * Partes vazias são omitidas; sem nenhuma parte, cai na mensagem padrão.
 */
export function buildLeadMessage({ name, projectType, message }: LeadMessageInput): string {
  const n = clean(name, NAME_MAX_LENGTH);
  const m = clean(message, MESSAGE_MAX_LENGTH);
  const type = projectTypes.find((t) => t.id === projectType);

  if (!n && !type && !m) return DEFAULT_MESSAGE;

  const parts = ["Olá, Saurs!"];
  if (n) parts.push(`Sou ${n}.`);
  if (type) {
    parts.push(
      type.phrase
        ? `Tenho interesse em ${type.phrase}.`
        : "Ainda não sei qual tipo de projeto preciso.",
    );
  }
  if (m) parts.push(/[.!?…]$/.test(m) ? m : `${m}.`);
  return parts.join(" ");
}

/** Link wa.me. Use sem argumento para o CTA genérico (header, hero). */
export function whatsappUrl(text: string = DEFAULT_MESSAGE): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export interface LeadErrors {
  name?: "empty";
}

/** Só o nome é obrigatório (decisions §3.10). Mensagem e tipo são opcionais. */
export function validateLead({ name }: LeadMessageInput): LeadErrors {
  return clean(name, NAME_MAX_LENGTH) ? {} : { name: "empty" };
}
