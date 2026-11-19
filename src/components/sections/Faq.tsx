import { faq, sectionIds } from "@/content/content";
import { isPlaceholder } from "@/content/types";

/**
 * 3.9 FAQ com <details>/<summary> nativos: teclado e leitor de tela sem JS.
 * Perguntas sem resposta real (placeholder) não aparecem; sem nenhuma, a seção some.
 */
export function Faq() {
  const items = faq.items.flatMap((i) =>
    isPlaceholder(i.answer) ? [] : [{ question: i.question, answer: i.answer }],
  );
  if (items.length === 0) return null;

  return (
    <section
      id={sectionIds.faq}
      aria-labelledby="faq-title"
      className="mx-auto max-w-[52rem] px-gutter py-section"
    >
      <h2 id="faq-title" data-reveal className="text-3xl text-text">
        {faq.title}
      </h2>
      <div className="mt-8 border-t border-border">
        {items.map((item, i) => (
          <details
            key={item.question}
            data-reveal
            style={{ "--reveal-i": i } as React.CSSProperties}
            className="faq-item border-b border-border"
          >
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg text-text">
              <span className="font-display font-bold">{item.question}</span>
              <span aria-hidden="true" className="faq-icon" />
            </summary>
            <p className="pb-6 text-text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
