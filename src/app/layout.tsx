import type { Metadata, Viewport } from "next";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { motionBootScript } from "@/components/motion/motion-script";
import { meta, sectionIds, site } from "@/content/content";
import { buildJsonLd, serializeJsonLd } from "@/lib/jsonld";
import { play, quattrocento, quattrocentoItalic } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: meta.title,
  description: meta.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    locale: site.locale,
    title: meta.title,
    description: meta.description,
    images: [{ ...meta.ogImage, url: meta.ogImage.src }],
  },
  twitter: {
    card: "summary_large_image",
    title: meta.title,
    description: meta.description,
    images: [meta.ogImage.src],
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a", // = --color-bg (a API de viewport não aceita var())
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={site.lang}
      className={`${play.variable} ${quattrocento.variable} ${quattrocentoItalic.variable}`}
      suppressHydrationWarning // o script de motion marca o <html> antes da hidratação
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionBootScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildJsonLd()) }}
        />
      </head>
      <body>
        <a href={`#${sectionIds.main}`} className="skip-link">
          Pular para o conteúdo
        </a>
        {children}
        <MotionRoot />
      </body>
    </html>
  );
}
