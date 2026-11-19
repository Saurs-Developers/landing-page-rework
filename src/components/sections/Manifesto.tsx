import { manifesto, sectionIds } from "@/content/content";

/** 3.8 Manifesto: frase de impacto. "FUTURO" em tamanho grande e azul; o resto, discreto. */
export function Manifesto() {
  return (
    <section
      id={sectionIds.manifesto}
      aria-labelledby="manifesto-title"
      className="mx-auto max-w-page px-gutter py-section text-center"
    >
      <h2 id="manifesto-title" className="flex flex-col items-center gap-2">
        <span data-reveal className="text-xl font-normal text-text-muted md:text-2xl">
          {manifesto.before}
        </span>
        <span
          data-reveal
          style={{ "--reveal-i": 1 } as React.CSSProperties}
          className="text-mega leading-tight tracking-mega text-brand"
        >
          {manifesto.word}
        </span>
        <span
          data-reveal
          style={{ "--reveal-i": 2 } as React.CSSProperties}
          className="text-xl font-normal text-text md:text-2xl"
        >
          {manifesto.after}
        </span>
      </h2>
    </section>
  );
}
