import { proof, sectionIds } from "@/content/content";

/**
 * 3.3 Prova social. Entra entre o Hero e o Problema, então ainda faz parte do
 * trecho da cena (data-scene-range). O único número é o do depoimento da
 * Florestcon; ele abre com a máscara horizontal (data-reveal="mask").
 */
export function Proof() {
  return (
    <section
      id={sectionIds.proof}
      data-scene-range
      aria-label="Resultados"
      className="mx-auto max-w-page px-gutter pb-section"
    >
      <div className="grid gap-8 rounded-lg border border-border bg-bg/75 px-6 py-10 backdrop-blur-sm md:grid-cols-[auto_1fr] md:items-center md:gap-16">
        <a href={proof.highlight.href} className="group block">
          <p
            data-reveal="mask"
            className="font-display text-4xl leading-tight font-bold tracking-display text-brand"
          >
            {proof.highlight.value}
          </p>
          <p
            data-reveal
            style={{ "--reveal-i": 1 } as React.CSSProperties}
            className="mt-1 text-lg text-text"
          >
            {proof.highlight.label}
          </p>
          <p
            data-reveal
            style={{ "--reveal-i": 2 } as React.CSSProperties}
            className="mt-1 text-sm text-text-muted underline-offset-4 group-hover:underline"
          >
            {proof.highlight.source}
          </p>
        </a>
        <div data-reveal style={{ "--reveal-i": 3 } as React.CSSProperties}>
          <p className="max-w-[40ch] text-lg text-text">{proof.line}</p>
          <p className="mt-3 text-sm tracking-eyebrow text-text-muted uppercase">
            {proof.clients.join("  ·  ")}
          </p>
        </div>
      </div>
    </section>
  );
}
