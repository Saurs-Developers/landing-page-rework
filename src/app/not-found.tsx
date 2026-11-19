import type { Metadata } from "next";
import Link from "next/link";
import { sectionIds, site } from "@/content/content";

export const metadata: Metadata = {
  title: `Página não encontrada — ${site.name}`,
  robots: { index: false },
};

/** 404 real: o export estático gera 404.html e a Cloudflare o serve com status 404. */
export default function NotFound() {
  return (
    <main
      id={sectionIds.main}
      className="mx-auto flex min-h-dvh max-w-page flex-col items-start justify-center gap-6 px-gutter"
    >
      <p className="text-sm font-bold tracking-eyebrow text-brand uppercase">Erro 404</p>
      <h1 className="text-4xl text-text">Essa página não existe.</h1>
      <p className="max-w-[48ch] text-lg text-text-muted">
        O endereço pode ter mudado ou ter sido digitado errado. Volte para a página inicial.
      </p>
      <Link
        href="/"
        className="rounded-pill bg-brand px-6 py-3 font-bold text-text-on-brand hover:bg-brand-hover"
      >
        Ir para o início
      </Link>
    </main>
  );
}
