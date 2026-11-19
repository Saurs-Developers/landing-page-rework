#!/usr/bin/env node
/**
 * Renderiza a cena do hero em Chrome headless a partir do export estático.
 *
 *   pnpm build && pnpm scene:fallback   → public/images/hero/scene-{landscape,portrait}.{avif,webp}
 *   pnpm build && pnpm scene:og         → public/og.png (1200×630): cena + marca + título
 *   pnpm build && pnpm scene:stages     → .scene-shots/<etapa>.png (conferência visual)
 *
 * Usa `?scene=capture&p=<progresso>` (HeroBackdrop): sem texto, sem cursor,
 * tempo congelado e espera o atributo `data-scene-ready` no <html>.
 * Chrome: variável CHROME_PATH ou `google-chrome` no PATH.
 */

import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import puppeteer from "puppeteer-core";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const outDir = join(root, "out");
const mode = process.argv[2] ?? "fallback";

if (!existsSync(join(outDir, "index.html"))) {
  console.error("Rode `pnpm build` antes: out/index.html não existe.");
  process.exit(1);
}

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  let file = join(outDir, decodeURIComponent(url.pathname));
  if (!file.startsWith(outDir)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? "google-chrome",
  headless: true,
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--hide-scrollbars",
  ],
});

async function shoot({ width, height, progress, time = 0, scale = 1 }) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: scale });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await page.goto(`${base}?scene=capture&p=${progress}&t=${time}&tier=high`, {
    waitUntil: "load",
  });
  await page.waitForSelector("html[data-scene-ready]", { timeout: 60_000 });
  // alguns frames extras para o swiftshader assentar
  await page.evaluate(() => new Promise((r) => setTimeout(r, 300)));
  const png = await page.screenshot({ type: "png" });
  await page.close();
  return png;
}

try {
  if (mode === "scroll") {
    // Coreografia: rola a página real e confere cena, etapa ativa, barra e fade
    const dir = join(root, ".scene-shots");
    mkdirSync(dir, { recursive: true });
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    // "Failed to load resource" é genérico; o handler de response abaixo informa a URL
    page.on(
      "console",
      (m) =>
        m.type() === "error" &&
        !m.text().startsWith("Failed to load resource") &&
        errors.push(m.text()),
    );
    // favicon ainda não existe (logo pendente): não conta como erro
    page.on("response", (r) => {
      if (r.status() >= 400 && !r.url().endsWith("/favicon.ico"))
        errors.push(`${r.status()} ${r.url()}`);
    });
    await page.setViewport({ width: 1440, height: 900 });
    // fps=off: o SwiftShader (CPU) rebaixaria a cena para a imagem estática
    await page.goto(`${base}?scene=debug&fps=off`, { waitUntil: "load" });
    await page.waitForSelector("html[data-choreography]", { timeout: 60_000 });
    await page.waitForSelector(".scene-backdrop[data-ready]", { timeout: 60_000 });
    await page.addStyleTag({ content: ".fixed.right-3.bottom-3{display:none}" }); // sem o painel

    const marks = await page.evaluate(() => {
      const top = (sel, edge = "top") =>
        document.querySelector(sel).getBoundingClientRect()[edge] + scrollY - innerHeight / 2;
      return [
        ["hero", 0],
        ["problema", top("#problema", "bottom") - innerHeight * 0.3],
        ["solucao", top("#solucao", "bottom")],
        ["think", top('[data-step="think"]') + innerHeight * 0.4],
        ["develop", top('[data-step="develop"]') + innerHeight * 0.4],
        ["deliver", top('[data-step="deliver"]') + innerHeight * 0.4],
        ["repeat", top('[data-step="repeat"]') + innerHeight * 0.4],
        ["depois", document.documentElement.scrollHeight],
      ];
    });

    const report = [];
    for (const [name, y] of marks) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, Math.round(y)));
      await page.evaluate(() => new Promise((r) => setTimeout(r, 3000)));
      const state = await page.evaluate(() => ({
        target: +window.__sceneControls.progress.toFixed(3),
        step: document.documentElement.dataset.sceneStep ?? null,
        active: [...document.querySelectorAll("[data-step][data-active]")].map(
          (e) => e.dataset.step,
        ),
        fill: document.querySelector("[data-steps-fill]").style.scale || null,
        opacity: getComputedStyle(document.querySelector(".scene-backdrop")).opacity,
        scrolled: document.documentElement.hasAttribute("data-scrolled"),
        unrevealed: [...document.querySelectorAll("[data-reveal]:not([data-revealed])")]
          .map((e) => e.textContent.slice(0, 18))
          .join(" | "),
      }));
      report.push({ name, ...state });
      await page.screenshot({ path: join(dir, `scroll-${name}.png`) });
    }
    console.table(report);

    // âncora: rola, foca o destino e atualiza o hash
    await page.evaluate(() => window.scrollTo(0, 0));
    // link real do menu do header (desktop)
    await page.click('header nav a[href="#como-funciona"]');
    await page.evaluate(() => new Promise((r) => setTimeout(r, 2500)));
    const anchor = await page.evaluate(() => ({
      hash: location.hash,
      focused: document.activeElement?.id,
      top: Math.round(document.getElementById("como-funciona").getBoundingClientRect().top),
    }));
    console.log("âncora", anchor, "erros", errors);
    if (errors.length || anchor.focused !== "como-funciona") process.exitCode = 1;
    await page.close();
  } else if (mode === "page") {
    // Página real (sem modo captura): fallback CSS → crossfade → canvas, com o texto
    const dir = join(root, ".scene-shots");
    mkdirSync(dir, { recursive: true });
    for (const [w, h, mobile] of [
      [1440, 900, false],
      [390, 844, true],
    ]) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile });
      await page.goto(base, { waitUntil: "load" });
      await page.screenshot({ path: join(dir, `page-before-${w}x${h}.png`) });
      await page.waitForSelector(".scene-backdrop[data-ready]", { timeout: 60_000 });
      await page.evaluate(() => new Promise((r) => setTimeout(r, 900)));
      const tier = await page.$eval(".scene-backdrop", (el) => el.dataset.tier);
      await page.screenshot({ path: join(dir, `page-after-${w}x${h}.png`) });
      console.log("✓ página", w, "tier", tier);
      await page.close();
    }

    // ?scene=debug: painel carrega e o slider move a cena, sem erros no console
    {
      const page = await browser.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(`${base}?scene=debug`, { waitUntil: "load" });
      await page.waitForSelector(".scene-backdrop[data-ready]", { timeout: 60_000 });
      await page.waitForSelector("input[type=range]", { timeout: 10_000 });
      const buttons = await page.$$("button");
      await buttons.at(-2)?.click(); // Deliver
      await page.evaluate(() => new Promise((r) => setTimeout(r, 2500)));
      await page.screenshot({ path: join(dir, "page-debug-1440x900.png") });
      console.log("✓ debug", { errors });
      if (errors.length) process.exitCode = 1;
      await page.close();
    }

    // reduced-motion: imagem estática, e o chunk 3D nunca é baixado
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    const scripts = [];
    page.on("response", (r) => r.url().endsWith(".js") && scripts.push(r.url()));
    await page.goto(base, { waitUntil: "load" });
    await page.evaluate(() => new Promise((r) => setTimeout(r, 3000)));
    await page.waitForSelector("html[data-choreography]", { timeout: 30_000 });
    await page.evaluate(() =>
      window.scrollTo(
        0,
        document.querySelector('[data-step="develop"]').getBoundingClientRect().top +
          scrollY -
          innerHeight / 3,
      ),
    );
    await page.evaluate(() => new Promise((r) => setTimeout(r, 500)));
    const state = await page.$eval(".scene-backdrop", (el) => ({
      lenis: document.documentElement.classList.contains("lenis"),
      motion: document.documentElement.hasAttribute("data-motion"),
      activeStep: document.documentElement.dataset.sceneStep ?? "nenhuma",
      tier: el.dataset.tier,
      canvas: !!el.querySelector("canvas"),
      img: el.querySelector("img").currentSrc,
      opacity: getComputedStyle(el.querySelector(".scene-fallback")).opacity,
    }));
    const bodies = await Promise.all(scripts.map((u) => fetch(u).then((r) => r.text())));
    const loaded3d = bodies.some((b) => b.includes("WebGLRenderer"));
    await page.screenshot({ path: join(dir, "page-reduced-1440x900.png") });
    console.log("✓ reduced-motion", { ...state, loaded3d });
    if (
      state.canvas ||
      loaded3d ||
      state.tier !== "static" ||
      state.lenis ||
      state.motion ||
      state.activeStep !== "develop"
    ) {
      process.exitCode = 1;
    }
    await page.close();
  } else if (mode === "sections") {
    // Seções da 3d (desktop e celular): captura cada uma, abre o menu móvel e o FAQ
    const dir = join(root, ".scene-shots");
    mkdirSync(dir, { recursive: true });
    const ids = ["resultados", "cases", "futuro", "duvidas", "contato"];
    for (const [label, viewport] of [
      ["desktop", { width: 1440, height: 900 }],
      ["mobile", { width: 390, height: 844, isMobile: true, hasTouch: true }],
    ]) {
      const page = await browser.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.setViewport(viewport);
      await page.goto(`${base}?scene=debug&fps=off`, { waitUntil: "load" });
      await page.evaluate(() => new Promise((r) => setTimeout(r, 1500)));
      for (const id of ids) {
        await page.evaluate((i) => {
          const y = document.getElementById(i).getBoundingClientRect().top + scrollY - 90;
          window.scrollTo(0, y);
        }, id);
        await page.evaluate(() => new Promise((r) => setTimeout(r, 1400)));
        await page.screenshot({ path: join(dir, `sec-${label}-${id}.png`) });
      }
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.evaluate(() => new Promise((r) => setTimeout(r, 1200)));
      await page.screenshot({ path: join(dir, `sec-${label}-rodape.png`) });
      if (label === "mobile") {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.click("header button[aria-controls]");
        await page.evaluate(() => new Promise((r) => setTimeout(r, 600)));
        await page.screenshot({ path: join(dir, "sec-mobile-menu.png") });
        await page.keyboard.press("Escape");
        const closed = await page.evaluate(() =>
          document.querySelector("header button[aria-controls]").getAttribute("aria-expanded"),
        );
        console.log("menu fechou com Escape:", closed === "false");
        if (closed !== "false") process.exitCode = 1;
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      console.log(label, { erros: errors, overflowHorizontal: overflow });
      if (errors.length || overflow) process.exitCode = 1;
      await page.close();
    }
  } else if (mode === "stages") {
    const dir = join(root, ".scene-shots");
    mkdirSync(dir, { recursive: true });
    const stages = [
      ["0-hero", 0],
      ["1-problema", 0.2],
      ["2-solucao-onda", 0.45],
      ["3-solucao-fim", 0.6],
      ["4-think", 0.66],
      ["5-develop", 0.78],
      ["6-deliver", 0.88],
      ["7-repeat", 1],
    ];
    const width = Number(process.env.W ?? 1440);
    const height = Number(process.env.H ?? 900);
    for (const [name, p] of stages) {
      const png = await shoot({ width, height, progress: p, time: p === 1 ? 2.2 : 0 });
      await sharp(png).toFile(join(dir, `${name}-${width}x${height}.png`));
      console.log("✓", name);
    }
  } else if (mode === "form") {
    // Mini-formulário: validação, mensagem montada, popup bloqueado
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${base}?scene=debug&fps=off`, { waitUntil: "load" });
    await page.evaluate(() => {
      window.__opened = [];
      window.__allow = true;
      window.open = (u) => (window.__opened.push(u), window.__allow ? {} : null);
    });
    const submit = 'form button[type="submit"]';
    await page.click(submit);
    const emptyError = await page.evaluate(
      () => document.querySelector('[role="alert"]')?.textContent,
    );
    const focusedName = await page.evaluate(() => document.activeElement?.getAttribute("name"));
    await page.type('input[name="name"]', "Ana");
    await page.select('select[name="projectType"]', "aplicativo");
    await page.type('textarea[name="message"]', "App para minha equipe");
    await page.click(submit);
    const opened = await page.evaluate(() => window.__opened.map((u) => decodeURIComponent(u)));
    await page.evaluate(() => (window.__allow = false));
    await page.click(submit);
    const blockedLink = await page.evaluate(
      () => document.querySelector("form [aria-live] a")?.getAttribute("href") ?? null,
    );
    console.log({ emptyError, focusedName, opened, blockedLink: !!blockedLink, errors });
    const ok =
      emptyError &&
      focusedName === "name" &&
      opened[0]?.endsWith(
        "Olá, Saurs! Sou Ana. Tenho interesse em um aplicativo. App para minha equipe.",
      ) &&
      blockedLink &&
      !errors.length;
    if (!ok) process.exitCode = 1;
    await page.close();
  } else if (mode === "og") {
    // Imagem de compartilhamento: cena (estado ordenado) + wordmark + título do hero.
    // Textos e fontes vêm do projeto (content.ts não é importável aqui; lê o JSON do build).
    const html = readFileSync(join(outDir, "index.html"), "utf8");
    const title = /<h1[^>]*>([^<]+)<\/h1>/.exec(html)?.[1];
    if (!title) throw new Error("H1 não encontrado em out/index.html");
    const bg = (await shoot({ width: 1200, height: 630, progress: 0.88 })).toString("base64");
    const font = (f) => readFileSync(join(root, "src/fonts", f)).toString("base64");
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630 });
    await page.setContent(`<!doctype html><meta charset="utf-8"><style>
      @font-face{font-family:Play;font-weight:700;src:url(data:font/woff2;base64,${font("play-latin-700-normal.woff2")})}
      @font-face{font-family:Q;font-weight:400;src:url(data:font/woff2;base64,${font("quattrocento-sans-latin-400-normal.woff2")})}
      *{margin:0;box-sizing:border-box}
      body{width:1200px;height:630px;background:#1a1a1a url(data:image/png;base64,${bg}) center/cover;color:#fafafa;position:relative;overflow:hidden}
      .veil{position:absolute;inset:0;background:linear-gradient(90deg,rgba(26,26,26,.94) 0%,rgba(26,26,26,.82) 52%,rgba(26,26,26,.15) 100%)}
      .c{position:absolute;left:72px;top:72px;bottom:72px;width:700px;display:flex;flex-direction:column;justify-content:space-between}
      .brand{font:700 30px Play;letter-spacing:.12em;text-transform:uppercase}
      h1{font:700 64px/1.08 Play;letter-spacing:-.02em}
      .sub{font:400 28px/1.4 Q;color:#a3a3a3;margin-top:20px}
      .bar{width:72px;height:4px;background:#bae6fd;border-radius:2px;margin-bottom:28px}
    </style><div class="veil"></div><div class="c"><div class="brand">Saurs</div>
    <div><div class="bar"></div><h1>${title}</h1><p class="sub">Sites, sistemas, aplicativos e SaaS, da ideia à entrega.</p></div></div>`);
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: "png" });
    await sharp(png).png({ compressionLevel: 9 }).toFile(join(root, "public/og.png"));
    await page.close();
    console.log("✓ og.png");
  } else {
    // Estado ordenado e iluminado (Deliver): é o que a cena "conclui".
    const p = 0.88;
    const dir = join(root, "public/images/hero");
    mkdirSync(dir, { recursive: true });

    const landscape = await shoot({ width: 1920, height: 1080, progress: p });
    const portrait = await shoot({ width: 540, height: 960, progress: p, scale: 2 });
    for (const [name, png] of [
      ["scene-landscape", landscape],
      ["scene-portrait", portrait],
    ]) {
      await sharp(png)
        .avif({ quality: 45, effort: 6 })
        .toFile(join(dir, `${name}.avif`));
      await sharp(png)
        .webp({ quality: 70, effort: 6 })
        .toFile(join(dir, `${name}.webp`));
      console.log("✓", name);
    }
  }
} finally {
  await browser.close();
  server.close();
}
