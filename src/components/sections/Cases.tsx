import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { cases, sectionIds, type CaseStudy } from "@/content/content";
import { isPlaceholder } from "@/content/types";

function Case({ item, index }: { item: CaseStudy; index: number }) {
  const { testimonial } = item;
  const image = isPlaceholder(item.image) ? null : item.image;
  const role = isPlaceholder(testimonial.role) ? null : testimonial.role;
  const byline = [testimonial.author, role, testimonial.company].filter(Boolean).join(", ");

  return (
    <article
      id={item.id}
      data-reveal
      data-highlight-on-arrival
      aria-labelledby={`${item.id}-title`}
      tabIndex={-1}
      className="rounded-xl border border-border bg-surface/90 p-6 shadow-card md:p-10"
    >
      <div className={`grid gap-10 ${image ? "lg:grid-cols-2 lg:items-center" : ""}`}>
        <div className={index % 2 === 1 && image ? "lg:order-2" : undefined}>
          <p className="text-xs font-bold tracking-eyebrow text-brand uppercase">{item.segment}</p>
          <h3 id={`${item.id}-title`} className="mt-2 text-3xl text-text">
            {item.name}
          </h3>
          <p className="mt-4 text-text-muted">{item.description}</p>

          <ul className="mt-6 flex flex-col gap-2">
            {item.results.map((r) => (
              <li key={r} className="flex gap-3 text-text">
                <span
                  aria-hidden="true"
                  className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand"
                />
                {r}
              </li>
            ))}
          </ul>

          <figure className="mt-8 border-l-2 border-brand-line pl-5">
            <blockquote className="text-lg text-text">
              <p>“{testimonial.quote}”</p>
            </blockquote>
            <figcaption className="mt-3 text-sm text-text-muted">{byline}</figcaption>
          </figure>

          <ButtonLink link={item.website} variant="secondary" className="mt-8" />
        </div>

        {image && (
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading="lazy"
            sizes="(min-width: 1024px) 560px, 100vw"
            className="w-full rounded-lg border border-border"
          />
        )}
      </div>
    </article>
  );
}

/** 3.7 Cases + depoimentos. Fora do trecho da cena (que termina em Como funciona). */
export function Cases() {
  return (
    <section
      id={sectionIds.cases}
      aria-labelledby="cases-title"
      className="mx-auto max-w-page px-gutter py-section"
    >
      <p
        data-reveal
        className="inline-block rounded-pill border border-brand-line px-3 py-1 text-xs font-bold tracking-eyebrow text-brand uppercase"
      >
        {cases.badge}
      </p>
      <h2
        id="cases-title"
        data-reveal
        style={{ "--reveal-i": 1 } as React.CSSProperties}
        className="mt-4 text-3xl text-text"
      >
        {cases.title}
      </h2>
      <div className="mt-12 flex flex-col gap-8">
        {cases.items.map((item, i) => (
          <Case key={item.id} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}
