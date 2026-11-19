import { sectionIds, solution } from "@/content/content";

/** 3.5 Solução, benefícios e serviços (decisions §3.5). Trecho 0,30 → 0,60: os blocos encaixam. */
export function Solution() {
  return (
    <section
      id={sectionIds.solution}
      data-scene-range
      aria-labelledby="solution-title"
      className="mx-auto max-w-page px-gutter py-section"
    >
      <div className="max-w-[44rem]">
        <p
          data-reveal
          className="inline-block rounded-pill border border-brand-line px-3 py-1 text-xs font-bold tracking-eyebrow text-brand uppercase"
        >
          {solution.badge}
        </p>
        <h2
          id="solution-title"
          data-reveal
          className="mt-4 text-3xl text-text"
          style={{ "--reveal-i": 1 } as React.CSSProperties}
        >
          {solution.title}
        </h2>
        <p
          data-reveal
          className="mt-6 text-lg text-text"
          style={{ "--reveal-i": 2 } as React.CSSProperties}
        >
          {solution.lead}
        </p>
        <p
          data-reveal
          className="mt-4 text-text-muted"
          style={{ "--reveal-i": 3 } as React.CSSProperties}
        >
          {solution.text}
        </p>
      </div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {solution.benefits.map((b, i) => (
          <li
            key={b.title}
            data-reveal
            style={{ "--reveal-i": i } as React.CSSProperties}
            className="rounded-lg border border-border bg-surface/90 p-6 shadow-card"
          >
            <h3 className="text-xl text-brand">{b.title}</h3>
            <p className="mt-2 text-text-muted">{b.text}</p>
          </li>
        ))}
      </ul>

      <div id={sectionIds.services} className="mt-section">
        <h3 data-reveal className="text-2xl text-text">
          {solution.servicesTitle}
        </h3>
        <ul className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {solution.services.map((s, i) => (
            <li
              key={s.title}
              data-reveal
              style={{ "--reveal-i": i % 3 } as React.CSSProperties}
              className="bg-surface/95 p-6"
            >
              <p className="font-display text-xl font-bold text-text">{s.title}</p>
              <p className="mt-1 text-text-muted">{s.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
