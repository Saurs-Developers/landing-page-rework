# Saurs Developers — landing page

Nova landing page de [saurs.dev](https://saurs.dev): Next.js 16 com export estático, Tailwind CSS v4 e, nas próximas fases, uma cena 3D no hero (React Three Fiber + GSAP).

## Rodando

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # gera out/
pnpm preview    # serve out/
pnpm check      # tipos, lint, testes e formatação
```

Requer Node ≥ 20.9 (`.nvmrc`: 22) e pnpm.

## Onde mexer

- **Texto:** `src/content/content.ts`
- **Cores, tipografia, espaço, motion:** `src/styles/tokens.css`
- **Link e mensagem do WhatsApp:** `src/lib/whatsapp.ts`

Regras, estrutura e decisões técnicas: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
