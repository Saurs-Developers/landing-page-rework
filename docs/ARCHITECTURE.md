# Arquitetura — Saurs Landing

Base: `docs/audit.md` (Fase 1) e `docs/decisions.md` (Fase 2), mantidos no projeto "Saurs Landing" do Claude.
Este arquivo registra o que a Fase 3a montou e as regras para as fases seguintes.

## Stack

| Item       | Escolha                                                                                     | Por quê                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack)                                                          | R3F + GSAP nas fases 3b/3c; componentes de servidor para o conteúdo estático              |
| Saída      | `output: "export"` (HTML estático em `out/`)                                                | Página única sem backend; roda em qualquer CDN                                            |
| Hospedagem | **Cloudflare Pages** (onde o site já está)                                                  | Zero migração; o export funciona igual na Vercel se mudar de ideia (decisions §8, item 8) |
| CSS        | Tailwind CSS v4 com `@theme`                                                                | Tokens viram utilities e variáveis CSS ao mesmo tempo                                     |
| Fontes     | Play 400/700 + Quattrocento Sans 400/700/400 itálico, WOFF2 subset latin, `next/font/local` | Google Fonts bloqueado no ambiente de build; self-host é mais rápido de qualquer jeito    |
| 3D         | three 0.187 puro (sem React Three Fiber), chunk carregado sob demanda                       | Ver "Cena 3D" abaixo                                                                      |
| Testes     | Vitest                                                                                      | Conteúdo, tokens e helper do WhatsApp                                                     |
| Pacotes    | pnpm, Node ≥ 20.9 (`.nvmrc`: 22)                                                            |                                                                                           |

## Estrutura

```
src/
  app/
    layout.tsx        <html lang="pt-BR">, fontes, skip link, metadados mínimos
    page.tsx          casca da página (só o hero em texto, na 3a)
    globals.css       Tailwind + tokens + base (sem valores literais)
    fonts.ts          next/font/local
  content/
    content.ts        TODO o texto da página, com status por item e fila de revisão
    types.ts          Placeholder, Maybe<T>, CopyStatus, ReviewItem
    content.test.ts
  lib/
    tokens.ts         nomes tipados dos tokens + leitura em runtime (GSAP, 3D)
    whatsapp.ts       links wa.me e mensagem do mini-formulário
  styles/
    tokens.css        fonte única de verdade (decisions §6)
  fonts/              WOFF2 + licenças OFL

Criadas nas fases seguintes:
  components/three/    3b — cena do hero (ver "Cena 3D do hero")
  components/motion/   3c — ver "Coreografia de scroll"
  components/layout/   3d — Header (client: menu móvel), Footer
  components/sections/ 3d — Proof, Problem, Solution, HowItWorks, Cases, Manifesto, Faq, Contact
  components/ui/       3d — ButtonLink (por ora só ele; criar outros só quando houver reuso)
  public/images/       prints dos cases (AVIF/WebP), fallback do hero, og.png
```

## Regras

1. **Valores visuais só em `src/styles/tokens.css`.** Componentes usam as utilities (`bg-surface`, `text-brand`, `py-section`, `ease-out-expo`) ou `var(--…)`. O teste `tokens.test.ts` falha se `globals.css` tiver cor literal.
2. **Texto só em `src/content/content.ts`.** Nenhum componente escreve copy.
3. **Nada é inventado.** O único número é "até 80 mil reais anuais" (Florestcon). `content.test.ts` falha se aparecer outro número em texto.
4. **Placeholders não vão para produção.** O que só a Saurs pode fornecer é `placeholder("…")`; os componentes usam `isPlaceholder()` para omitir o bloco. A lista do que falta está em `review` (fim de `content.ts`).
5. **JS lê tokens, não duplica.** `readToken`, `readDuration` e `readLength` em `src/lib/tokens.ts`. Para um token novo usado no JS, adicione o nome na lista; o teste confere se ele existe no CSS.
6. **`pnpm check` passa antes de cada commit** (tipos, lint, testes, Prettier).

## Tokens: diferenças em relação ao decisions §6.3

Ajustes de nome para caber nos namespaces do Tailwind v4 (valores iguais):

| §6.3              | Código              | Utility                                        |
| ----------------- | ------------------- | ---------------------------------------------- |
| `--space-section` | `--spacing-section` | `py-section`                                   |
| `--space-gutter`  | `--spacing-gutter`  | `px-gutter`                                    |
| `--container-max` | `--container-page`  | `max-w-page` (`max` colidiria com `max-w-max`) |

Outros pontos:

- `@theme static` emite todas as variáveis em `:root` mesmo sem uso em classe, para o JS poder lê-las.
- A paleta padrão do Tailwind foi removida (`--color-*: initial`): `bg-red-500` não existe.
- O minificador reescreve durações (`1200ms` → `1.2s`); `parseDuration` aceita os dois formatos.
- `themeColor` em `layout.tsx` repete `#1a1a1a` porque a API de viewport do Next não aceita `var()`.

## Cena 3D do hero (Fase 3b)

Código em `src/components/three/`:

| Arquivo            | Papel                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config.ts`        | Tiers (2.400 / 1.000 blocos), câmera (fov 35°, elevação 52°, paralaxe ±2,5°), geometria do mundo, limites de FPS                                  |
| `instances.ts`     | Atributos por bloco (`aChaos`, `aOrder`, `aHeight`, `aDelay`, `aSeed`), determinísticos; painéis do "dashboard"                                   |
| `stages.ts`        | Progresso 0 → 1 vira todos os uniforms (deriva, puxão, montagem, preenchimento, extrusão, subida, pulso). Faixas das etapas lidas do `content.ts` |
| `shaders.ts`       | Blocos (posição no vertex shader, contornos procedurais, fresnel azul, neblina) e grid procedural                                                 |
| `runtime.ts`       | Estado mutável por frame: câmera, cursor (raio × plano em JS), uniforms, monitor de FPS                                                           |
| `HeroCanvas.tsx`   | **Raiz do chunk 3D.** WebGLRenderer + loop rAF + ResizeObserver                                                                                   |
| `HeroBackdrop.tsx` | Bundle inicial: grid em CSS, imagem estática, decisão de tier, import tardio, crossfade, pausa                                                    |
| `controls.ts`      | `sceneControls`, `setSceneProgress()` e o relógio único `onFrame()` / `setFrameDriver()`                                                          |
| `quality.ts`       | Tier inicial e `FpsMonitor`                                                                                                                       |
| `SceneDebug.tsx`   | Painel `?scene=debug` (chunk próprio, 2 KB)                                                                                                       |

Como funciona:

1. O HTML estático já traz o grid em CSS com a **mesma perspectiva da câmera** (`perspective = 50dvh / tan(fov/2)`, `rotateX(90° − elevação)`); a câmera 3D fica na distância em que 1 célula = `--grid-cell` no centro da tela. Por isso o crossfade (600 ms, `--dur-crossfade`) quase não aparece.
2. Depois de `load` + `requestIdleCallback`, o tier é decidido: `static` com reduced-motion, sem WebGL2, `saveData` ou `deviceMemory ≤ 2`; `medium` com toque, tela < 768 px, ≤ 4 núcleos ou ≤ 4 GB; senão `high`.
3. Em execução, o `FpsMonitor` rebaixa `high → medium` (< 45 FPS por 2 s) e `medium → static` (< 30 FPS por 3 s), depois de 2 s de aquecimento.
4. O loop para fora dos elementos `[data-scene-range]` (IntersectionObserver) e com a aba oculta. **Na 3d, toda seção de Hero até "Como funciona" recebe `data-scene-range`.**
5. Estático: imagem AVIF/WebP do estado ordenado, renderizada da própria cena, a 50% de opacidade. Com reduced-motion ela aparece por CSS, mesmo sem JS, e o chunk 3D nunca é baixado.
6. Um véu radial atrás da coluna de texto mantém o subtítulo legível sobre a cena.

Desvios do decisions §2.3, registrados:

- **Sem React Three Fiber nem drei.** O R3F faz `import * as THREE` + `extend(THREE)` e o chunk ia a 246 KB gzip (meta: 180). Com three puro e imports nomeados, 137 KB. A cena tem só duas malhas e um loop; o wrapper em `HeroCanvas.tsx` cobre isso. Para a 3c, o GSAP/Lenis conversa com a cena por `sceneControls`, sem depender de R3F.
- **Um único uniform de progresso.** O GSAP anima só `sceneControls.progress`; `stageUniforms()` deriva `uExtrude`, `uPulse` etc. Assim a narrativa fica testável e a 3c não precisa conhecer os shaders.
- **Fallback durante o carregamento = grid em CSS**, não a imagem ordenada. A imagem mostra o estado final; trocar dela para o caos inicial do canvas seria um salto visual. A imagem fica para o tier estático.
- **Sem bloom** (como previsto: só se o profiling da 3e mostrar folga).

Ferramentas:

| Comando                                            | O que faz                                                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `/?scene=debug`                                    | Painel com slider de progresso, atalhos por etapa, tier e FPS                                  |
| `/?scene=capture&p=0.88`                           | Só a cena, tempo congelado (usado pelos scripts)                                               |
| `pnpm build && pnpm scene:fallback`                | Regera `public/images/hero/scene-*.{avif,webp}`                                                |
| `pnpm build && pnpm scene:og`                      | Regera `public/og.png` (cena + wordmark + H1 lido do build, fontes do projeto)                 |
| `pnpm build && pnpm scene:form`                    | Formulário: erro de nome vazio com foco, mensagem montada, popup bloqueado com link            |
| `pnpm build && pnpm scene:stages`                  | Screenshots de cada etapa em `.scene-shots/`                                                   |
| `pnpm build && node scripts/render-scene.mjs page` | Página real antes/depois do crossfade, painel de debug sem erros e reduced-motion sem chunk 3D |

Os scripts usam o Chrome local (`CHROME_PATH` ou `google-chrome`) com SwiftShader.

## Coreografia de scroll (Fase 3c)

Código em `src/components/motion/`:

| Arquivo                   | Papel                                                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `motion-script.ts`        | Script inline no `<head>`: liga `html[data-motion]` antes da pintura (sem reduced-motion) e desliga em 4 s se o JS não subir             |
| `MotionRoot.tsx`          | Bundle inicial (leve): revelações de texto e import tardio do chunk abaixo                                                               |
| `choreography.ts`         | Funções puras: pontos de controle scroll → progresso, medidos nas seções                                                                 |
| `choreography-runtime.ts` | **Raiz do chunk de motion (51 KB gzip):** Lenis, ScrollTrigger, relógio único, etapa ativa, barra, saída da cena, âncoras, CTA magnético |

Como funciona:

1. **Relógio único.** `controls.ts` tem `onFrame()`: começa com rAF e, quando o chunk carrega, passa para o `gsap.ticker`. Em cada tick: Lenis → ScrollTrigger → cena 3D. Sem dois laços disputando o frame.
2. **Progresso preso às seções.** A cena chega a 0,30 quando o fim do Problema cruza o centro da tela, a 0,60 no fim da Solução, e cada etapa vai de `range[0]` a `range[1]` enquanto o seu bloco `[data-step]` cruza o centro. Remedido a cada `ScrollTrigger.refresh` e quando as fontes carregam.
3. **Etapa ativa** = `activeStep(progresso)`: marca `data-active` no bloco e `html[data-scene-step]`, que acende a palavra do lema no hero (`[data-motto-word]`).
4. **A cena sai** entre "fim de Como funciona a 60%" e "a 10%" da tela (opacidade do fundo 1 → 0); o loop para quando nenhum `[data-scene-range]` está visível.
5. **Revelação:** `[data-reveal]` sobe `--reveal-distance` com `--dur-slow`/`--ease-out-expo`, stagger `--reveal-i × --stagger`; `data-reveal="mask"` abre com máscara horizontal. Revela também o que ficou acima do viewport (pulo por âncora). O H1 nunca é revelado (LCP).
6. **Âncoras:** rolagem suave com o Lenis (respeita `scroll-margin-top`), foco no destino, `pushState` do hash; destinos com `data-highlight-on-arrival` ganham `data-highlighted` por `--dur-highlight` (1,2 s).
7. **CTA magnético:** `[data-magnetic]`, até `--magnetic-max` (6 px), só com ponteiro fino e sem reduced-motion.
8. **Header:** `html[data-scrolled]` depois de 80 px (o Header da 3d só precisa estilizar isso).

Com reduced-motion: sem Lenis, sem revelação, sem magnético; progresso, etapa ativa e barra continuam (são posição, não animação) e o fundo é a imagem estática.

**Contrato para a 3d** (atributos que a coreografia lê):

| Atributo                               | Onde                                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `id` das seções (`sectionIds`)         | Problema, Solução e Como funciona são medidas por id                                           |
| `data-scene-range`                     | Toda seção do Hero até Como funciona (a Prova social, que entra entre Hero e Problema, também) |
| `data-step="<key>"`, `data-steps-fill` | Já em `HowItWorks.tsx`                                                                         |
| `data-reveal`, `--reveal-i`            | Títulos, parágrafos, cards; nunca no H1                                                        |
| `data-reveal="mask"`                   | O "R$ 80 mil" da prova social                                                                  |
| `data-highlight-on-arrival`            | Cards dos cases (`#case-cspr`, `#case-g-training`)                                             |
| `data-magnetic`                        | CTAs principais                                                                                |
| `html[data-scrolled]`                  | Estilo do header com fundo                                                                     |

Seções feitas na 3c por serem parte da coreografia: **Problema, Solução (com serviços) e Como funciona**.

### Seções da 3d

- **Header:** fixo, wordmark em texto "SAURS" (o logo SVG ainda não foi enviado; trocar em `Header.tsx` e `Footer.tsx`). Menu móvel é um disclosure (`aria-expanded`, Escape fecha e devolve o foco, clique no link fecha). Fundo com `html[data-scrolled]`.
- **Prova social:** com `data-scene-range`; o número usa `data-reveal="mask"`; tem véu `bg-bg/75` porque fica sobre a cena.
- **Cases:** `#case-cspr` e `#case-g-training` são os próprios `<article>` com `data-highlight-on-arrival` e `tabIndex=-1`. O print só é renderizado se existir (`isPlaceholder`); sem imagem o card vira coluna única.
- **FAQ:** `<details>/<summary>` nativo. Perguntas cujo `answer` ainda é placeholder **não aparecem** (hoje: 2 de 7). Sem nenhuma resposta real, a seção some.
- **CTA final:** texto + link direto do WhatsApp com `data-magnetic`. O mini-formulário entra na 3e dentro de `[data-contact-form-slot]`.
- **Rodapé:** só mostra e-mail, CNPJ, cidade, redes e política quando deixarem de ser placeholder.
- A página não tem mais o espaçador provisório do fim: o fim da cena agora acontece ao rolar de Como funciona para Cases.

`pnpm scene:sections` captura cada seção nova no desktop e no celular, abre o menu móvel, fecha com Escape e confere erros e rolagem horizontal. A âncora do `scene:scroll` agora usa o link real do menu do header.

Verificação: `pnpm build && pnpm scene:scroll` rola a página real (`?scene=debug&fps=off`), confere progresso, etapa, barra, saída da cena, revelações e âncora com foco, e salva screenshots em `.scene-shots/`. `node scripts/render-scene.mjs page` cobre reduced-motion (sem Lenis, sem chunk 3D, etapa ativa funcionando).

## Medições (build de produção)

| Item               | Valor                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| CSS                | 5,8 KB gzip                                                                                                                  |
| Fontes com preload | 4 arquivos, 84 KB (itálico de 26 KB sem preload)                                                                             |
| JS inicial         | 191 KB gzip somando todos os chunks do HTML, todos `async` (3d: 186 KB; o "177" das fases 3a–3c contava só os cinco maiores) |
| Chunk 3D           | 137 KB gzip, importado depois de `load` + ocioso (meta ≤ 180 KB)                                                             |
| Chunk de motion    | 51 KB gzip (GSAP + ScrollTrigger + Lenis), depois de `load` + ocioso                                                         |
| Imagem estática    | 85 KB AVIF paisagem, 36 KB retrato (só no tier estático)                                                                     |

O JS base do Next é o principal custo novo em relação ao site atual em Astro. Ele não bloqueia o LCP (o H1 é texto do HTML estático), mas precisa entrar no orçamento medido na 3e junto com o chunk 3D (meta: ≤ 180 KB gzip, carregado depois do `load`).

## Fase 3e: formulário, SEO e metadados

- **Formulário** (`ContactForm.tsx`, client): nome obrigatório (erro inline com foco no campo e `role="alert"`), tipo de projeto e mensagem opcionais (500 caracteres, contador). `validateLead` + `buildLeadMessage` + `whatsappUrl` em `lib/whatsapp.ts` (testados). Abre o WhatsApp com `window.open` no mesmo clique; se o navegador bloquear, mostra o link direto. Nada é salvo.
- **Metadados** (`layout.tsx`): title, description, canonical, Open Graph, Twitter `summary_large_image`, `robots`.
- **JSON-LD** (`lib/jsonld.ts`, testado): `Organization` + `ProfessionalService` com o WhatsApp como `contactPoint` e `areaServed: BR`; `FAQPage` só com as perguntas respondidas. Logo, endereço, e-mail e redes entram sozinhos quando deixarem de ser placeholder.
- **`robots.txt`, `sitemap.xml`** (rotas de metadados do Next, estáticas) e **404 real** (`not-found.tsx` → `404.html`).
- **`og.png`**: composto por `pnpm scene:og`. **`icon.svg`** é provisório (um "S" na cor da marca); trocar pelo logo quando chegar.

## Scripts

| Comando        | O que faz                          |
| -------------- | ---------------------------------- |
| `pnpm dev`     | servidor de desenvolvimento        |
| `pnpm build`   | export estático em `out/`          |
| `pnpm preview` | serve `out/` localmente            |
| `pnpm check`   | tipos + lint + testes + formatação |

## Plano de fases

| Etapa                                                                       | Modelo | Effort | Status | Observação                                                                                         |
| --------------------------------------------------------------------------- | ------ | ------ | ------ | -------------------------------------------------------------------------------------------------- |
| Fase 1: auditoria do site                                                   | Opus   | medium | feito  | É mais extração do que raciocínio. Sai em `docs/audit.md`                                          |
| Fase 2: direção criativa, arquitetura de informação, copy, tokens           | Opus   | extra  | feito  | Gasta poucos tokens e define todo o resto, então aqui o extra compensa. Sai em `docs/decisions.md` |
| `/clear`                                                                    |        |        |        |                                                                                                    |
| Fase 3a: setup do projeto (Next, Tailwind, tokens, estrutura, `content.ts`) | Opus   | high   | feito  |                                                                                                    |
| Fase 3b: cena 3D do hero, shaders, fallback e qualidade adaptativa          | Opus   | high   | feito  |                                                                                                    |
| Fase 3c: coreografia de scroll (GSAP, ScrollTrigger, Lenis com a cena)      | Opus   | high   | feito  |                                                                                                    |
| Fase 3d: seções comuns                                                      | Sonnet | medium | feito  | Economiza limite                                                                                   |
| Fase 3e: formulários, SEO, metadados                                        | Sonnet | medium | feito  |                                                                                                    |
| `/clear`                                                                    |        |        |        |                                                                                                    |
| Fase 4a: correções do Lighthouse e do axe                                   | Sonnet | medium |        | Rode o Lighthouse você mesmo e cole só os problemas                                                |
| Fase 4b: autocrítica e polimento final                                      | Opus   | high   |        |                                                                                                    |
| Bug travado                                                                 | Opus   | extra  |        | Só pontualmente                                                                                    |

Uso estimado: de 2 a 3 janelas de 5 horas. Usando o Sonnet nas partes mais simples, o projeto deve caber nessa faixa sem comprometer demais o limite semanal.

## Pendências que afetam o código

- Logo `logo_small.svg` e print `cspr.png`: o ambiente não conseguiu baixar de saurs.dev. Colocar em `public/` (o logo também vira favicon).
- Print do G Training com dados fictícios: **bloqueia a publicação**.
- Demais itens em `review` (`content.ts`) e em decisions §8.
