import type { NextConfig } from "next";

/**
 * Landing page 100% estática.
 * `output: "export"` gera HTML/CSS/JS em `out/`, que roda em qualquer CDN
 * (Cloudflare Pages, onde o site está hoje, ou Vercel). Ver docs/ARCHITECTURE.md.
 */
const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // O otimizador padrão do next/image precisa de servidor. As imagens
    // (prints dos cases, fallback do hero) são geradas em AVIF/WebP no build.
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
