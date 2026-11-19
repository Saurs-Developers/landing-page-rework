import localFont from "next/font/local";

/*
 * Play e Quattrocento Sans (SIL OFL 1.1, licenças em src/fonts/).
 * WOFF2 com subset latin (cobre pt-BR): ~111 KB no total, contra ~230 KB dos
 * quatro TTF do site atual (audit §7.4). Self-hosted: next/font gera @font-face,
 * preload e fallback com métricas ajustadas (evita CLS).
 */

export const play = localFont({
  src: [
    { path: "../fonts/play-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/play-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-play",
  display: "swap",
  adjustFontFallback: "Arial",
});

/*
 * Regular e bold com preload (texto acima da dobra). O itálico só aparece nos
 * depoimentos, bem abaixo da dobra: fica numa instância separada, sem preload,
 * registrada com o mesmo nome de família ("quattrocento", que o next/font gera
 * a partir do nome da constante acima) para o `font-style: italic` achá-la.
 * O next/font exige literais nas opções, por isso o nome está repetido.
 */

export const quattrocento = localFont({
  src: [
    {
      path: "../fonts/quattrocento-sans-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/quattrocento-sans-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-quattrocento",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const quattrocentoItalic = localFont({
  src: [
    {
      path: "../fonts/quattrocento-sans-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-quattrocento-italic",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "font-family", value: "quattrocento" }],
});
