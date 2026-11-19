import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Cases } from "@/components/sections/Cases";
import { Contact } from "@/components/sections/Contact";
import { Faq } from "@/components/sections/Faq";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Manifesto } from "@/components/sections/Manifesto";
import { Problem } from "@/components/sections/Problem";
import { Proof } from "@/components/sections/Proof";
import { Solution } from "@/components/sections/Solution";
import { HeroBackdrop } from "@/components/three/HeroBackdrop";
import { hero, howItWorks, sectionIds, site } from "@/content/content";

/*
 * Ordem final (decisions §3): Header → Hero → Prova social → Problema →
 * Solução → Como funciona → Cases → Manifesto → FAQ → CTA final → Rodapé.
 * Todas as seções existem desde a 3d. O formulário do CTA final entra na 3e.
 *
 * Atributos que a coreografia usa (src/components/motion):
 * - `data-scene-range`: seções em que a cena 3D fica ativa (loop para fora delas)
 * - `data-reveal` (+ `--reveal-i`): revelação de texto; nunca no H1
 * - `data-step`, `data-steps-fill`: etapas de "Como funciona"
 * - `data-motto-word`: palavra do lema que acende com a etapa ativa
 * - `data-magnetic`: CTA com efeito magnético (desktop)
 */
export default function Home() {
  return (
    <>
      <Header />
      <HeroBackdrop />
      <main id={sectionIds.main} className="relative z-(--z-content)">
        <section
          id={sectionIds.hero}
          data-scene-range
          aria-labelledby="hero-title"
          className="mx-auto flex min-h-dvh max-w-page flex-col justify-center gap-6 px-gutter py-section"
        >
          <p data-reveal className="text-sm font-bold tracking-eyebrow text-brand uppercase">
            {hero.eyebrow}
          </p>
          <h1
            id="hero-title"
            className="max-w-[18ch] text-display leading-tight tracking-display text-text"
          >
            {hero.title}
          </h1>
          <p
            data-reveal
            style={{ "--reveal-i": 1 } as React.CSSProperties}
            className="max-w-[60ch] text-lg text-text-muted"
          >
            {hero.subtitle}
          </p>
          <div
            data-reveal
            style={{ "--reveal-i": 2 } as React.CSSProperties}
            className="flex flex-wrap gap-4 pt-2"
          >
            <a
              href={hero.primaryCta.href}
              target="_blank"
              rel="noopener noreferrer"
              data-magnetic
              className="rounded-pill bg-brand px-6 py-3 font-bold text-text-on-brand transition-colors duration-(--dur-fast) ease-standard hover:bg-brand-hover"
            >
              {hero.primaryCta.label}
            </a>
            <a
              href={hero.secondaryCta.href}
              className="rounded-pill border border-border-strong px-6 py-3 font-bold text-text transition-colors duration-(--dur-fast) ease-standard hover:border-brand-line"
            >
              {hero.secondaryCta.label}
            </a>
          </div>
          <p
            lang="en"
            data-reveal
            style={{ "--reveal-i": 3 } as React.CSSProperties}
            className="pt-8 font-display text-sm tracking-eyebrow text-text-muted"
          >
            {site.motto.map((word, i) => (
              <span key={word}>
                <span data-motto-word={howItWorks.steps[i]?.key} className="motto-word">
                  {word}
                </span>
                {i < site.motto.length - 1 && ", "}
              </span>
            ))}
          </p>
        </section>

        <Proof />
        <Problem />
        <Solution />
        <HowItWorks />

        <Cases />
        <Manifesto />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
