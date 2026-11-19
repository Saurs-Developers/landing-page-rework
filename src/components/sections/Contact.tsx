import { contact, sectionIds } from "@/content/content";
import { isPlaceholder } from "@/content/types";
import { ContactForm } from "./ContactForm";

/**
 * 3.10 CTA final: texto, mini-formulário que abre o WhatsApp e o link direto.
 */
export function Contact() {
  const email = isPlaceholder(contact.email) ? null : contact.email;
  return (
    <section
      id={sectionIds.contact}
      aria-labelledby="contact-title"
      className="mx-auto max-w-page px-gutter py-section"
    >
      <div className="rounded-xl border border-border bg-surface/90 px-6 py-12 text-center shadow-card md:px-16 md:py-20">
        <p
          data-reveal
          className="inline-block rounded-pill border border-brand-line px-3 py-1 text-xs font-bold tracking-eyebrow text-brand uppercase"
        >
          {contact.badge}
        </p>
        <h2
          id="contact-title"
          data-reveal
          style={{ "--reveal-i": 1 } as React.CSSProperties}
          className="mx-auto mt-4 max-w-[20ch] text-4xl text-text"
        >
          {contact.title}
        </h2>
        <p
          data-reveal
          style={{ "--reveal-i": 2 } as React.CSSProperties}
          className="mx-auto mt-6 max-w-[56ch] text-lg text-text-muted"
        >
          {contact.text}
        </p>
        <div data-reveal style={{ "--reveal-i": 3 } as React.CSSProperties}>
          <ContactForm />
          <p className="mt-8 text-text-muted">
            {contact.directLink.prefix}{" "}
            <a
              href={contact.directLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-brand underline underline-offset-4"
            >
              {contact.directLink.label}
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
            {email && (
              <>
                {" "}
                ou escreva para{" "}
                <a href={`mailto:${email}`} className="text-text underline underline-offset-4">
                  {email}
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
