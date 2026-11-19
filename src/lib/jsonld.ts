import { contact, faq, meta, site } from "@/content/content";
import { isPlaceholder } from "@/content/types";

/**
 * JSON-LD (decisions §3.12): Organization + ProfessionalService e, só com
 * respostas reais, FAQPage. Campos que ainda são placeholder (logo, endereço,
 * redes) ficam de fora em vez de serem inventados.
 */
export function buildJsonLd() {
  const social = isPlaceholder(site.social) ? [] : site.social.map((s) => s.href);
  const email = isPlaceholder(contact.email) ? undefined : contact.email;
  const address = isPlaceholder(meta.address) ? undefined : meta.address;

  const business = {
    "@type": ["Organization", "ProfessionalService"],
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: `${site.url}/`,
    description: meta.description,
    areaServed: "BR",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      telephone: site.whatsapp.display,
      availableLanguage: "pt-BR",
      ...(email && { email }),
    },
    ...(address && { address: { "@type": "PostalAddress", streetAddress: address } }),
    ...(social.length > 0 && { sameAs: social }),
  };

  const questions = faq.items.flatMap((i) =>
    isPlaceholder(i.answer)
      ? []
      : [
          {
            "@type": "Question",
            name: i.question,
            acceptedAnswer: { "@type": "Answer", text: i.answer },
          },
        ],
  );

  return {
    "@context": "https://schema.org",
    "@graph": [
      business,
      ...(questions.length > 0 ? [{ "@type": "FAQPage", mainEntity: questions }] : []),
    ],
  };
}

/** `<` escapado para o JSON nunca fechar o <script>. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
