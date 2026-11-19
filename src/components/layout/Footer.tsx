import { footer, site } from "@/content/content";
import { isPlaceholder } from "@/content/types";

/** 3.11 Rodapé. Só mostra o que existe: e-mail, CNPJ, cidade, redes e política são placeholders até a Saurs enviar. */
export function Footer() {
  const email = isPlaceholder(site.email) ? null : site.email;
  const cnpj = isPlaceholder(site.cnpj) ? null : site.cnpj;
  const city = isPlaceholder(site.city) ? null : site.city;
  const social = isPlaceholder(site.social) ? [] : site.social;
  const privacy = isPlaceholder(site.privacyPolicy) ? null : site.privacyPolicy;
  const legal = [cnpj && `CNPJ ${cnpj}`, city].filter(Boolean).join(" · ");

  return (
    <footer className="relative z-(--z-content) border-t border-border bg-bg-deep">
      <div className="mx-auto flex max-w-page flex-col gap-8 px-gutter py-12 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-xl font-bold tracking-eyebrow text-text uppercase">
            Saurs
          </p>
          <p className="mt-2 text-text-muted">{site.name}</p>
        </div>

        <ul className="flex flex-col gap-3 text-text-muted md:items-end">
          <li>
            <a
              href={site.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text hover:text-brand"
            >
              {footer.whatsappLabel}: {site.whatsapp.display}
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </li>
          {email && (
            <li>
              <a href={`mailto:${email}`} className="hover:text-text">
                {email}
              </a>
            </li>
          )}
          {social.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text"
              >
                {s.label}
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-page flex-col gap-2 px-gutter py-6 text-sm text-text-muted md:flex-row md:justify-between">
          <p>
            {footer.copyright(new Date().getFullYear())}
            {legal && ` · ${legal}`}
          </p>
          {privacy && (
            <a href={privacy.href} className="hover:text-text">
              {privacy.label}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
