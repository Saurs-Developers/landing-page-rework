<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Regras deste projeto

- Leia `docs/ARCHITECTURE.md` antes de começar uma fase.
- Valores visuais só em `src/styles/tokens.css`; texto só em `src/content/content.ts`.
- Não invente números, logos, depoimentos ou fatos. O que falta é `placeholder(...)` e não é renderizado.
- Rode `pnpm check` e `pnpm build` antes de cada commit.
