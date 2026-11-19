import { howItWorks, sectionIds } from "@/content/content";

/**
 * 3.6 Como funciona (decisions §3.6 e §5). Trecho 0,60 → 1 da cena.
 *
 * Cada etapa ocupa ~uma tela; a coreografia (choreography-runtime.ts) mede
 * os blocos `[data-step]` para sincronizar a cena, marca `data-active` na
 * etapa do centro da tela e enche a barra vertical (`[data-steps-fill]`).
 * Sem JS ou com reduced-motion, a seção é uma lista comum e legível.
 */
export function HowItWorks() {
  return (
    <section
      id={sectionIds.howItWorks}
      data-scene-range
      aria-labelledby="how-title"
      className="mx-auto max-w-page px-gutter pt-section"
    >
      <h2 id="how-title" data-reveal className="text-3xl text-text">
        {howItWorks.title}
      </h2>

      <div className="relative mt-8 md:pl-10">
        {/* Barra de progresso vertical (desktop) */}
        <div
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-0 hidden w-px bg-border md:block"
        >
          <div data-steps-fill className="steps-fill size-full origin-top bg-brand" />
        </div>

        <ol className="flex flex-col">
          {howItWorks.steps.map((step) => (
            <li
              key={step.key}
              data-step={step.key}
              className="step flex min-h-[80svh] max-w-[34rem] flex-col justify-center py-12"
            >
              <p
                lang="en"
                aria-hidden="true"
                className="step-motto font-display text-4xl leading-tight font-bold tracking-display"
              >
                {step.motto}
              </p>
              <h3 className="step-title mt-2 text-xl">{step.label}</h3>
              <p className="mt-3 text-lg text-text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
