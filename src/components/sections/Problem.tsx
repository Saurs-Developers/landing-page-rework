import { problem, sectionIds } from "@/content/content";

/** 3.4 Problema (decisions §3.4). Trecho 0 → 0,30 da cena: a deriva desacelera. */
export function Problem() {
  return (
    <section
      id={sectionIds.problem}
      data-scene-range
      aria-labelledby="problem-title"
      className="mx-auto max-w-page px-gutter py-section"
    >
      <div className="max-w-[40rem]">
        <p
          data-reveal
          className="text-sm font-bold tracking-eyebrow text-brand uppercase"
          style={{ "--reveal-i": 0 } as React.CSSProperties}
        >
          {problem.eyebrow}
        </p>
        <h2
          id="problem-title"
          data-reveal
          className="mt-4 text-3xl text-text"
          style={{ "--reveal-i": 1 } as React.CSSProperties}
        >
          {problem.title}
        </h2>
      </div>

      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {problem.pains.map((pain, i) => (
          <li
            key={pain.title}
            data-reveal
            style={{ "--reveal-i": i } as React.CSSProperties}
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface/90 p-6 shadow-card"
          >
            <h3 className="text-xl text-text">{pain.title}</h3>
            <p className="text-text-muted">{pain.text}</p>
            <a
              href={pain.link.href}
              className="mt-auto pt-2 font-bold text-brand underline-offset-4 hover:underline"
            >
              {pain.link.label}
              <span aria-hidden="true"> →</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
