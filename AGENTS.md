# AGENTS.md

## Cursor Cloud specific instructions

This is a SvelteKit / Svelte 5 app (Singapore HDB resale price prediction tool). Prediction logic runs in a SvelteKit server route (`src/routes/api/prices/+server.ts`) that queries a Cloudflare D1 database directly — there is no external backend.

### Key commands

All commands use **npm** (lockfile: `package-lock.json`). See `package.json` `"scripts"` for the full list.

| Task         | Command                                              |
| ------------ | ---------------------------------------------------- |
| Install deps | `npm install`                                        |
| Dev server   | `npm run dev` (serves at `http://localhost:5173`)    |
| Lint         | `npm run lint` (Prettier + ESLint)                   |
| Format       | `npm run format`                                     |
| Type check   | `npm run check`                                      |
| Unit tests   | `npm run test:unit` (Vitest)                         |
| E2E tests    | `npm run test:e2e` (Playwright, mocks the API route) |
| Build        | `npm run build`                                      |
| Deploy       | `npm run deploy`                                     |
| Wrangler dev | `npm run wrangler:dev`                               |

### Non-obvious caveats

- Playwright browsers must be installed separately after `npm install`: `npx playwright install --with-deps chromium`.
- The prediction API route (`/api/prices`) queries the Cloudflare D1 database (`ee4802-g20-tool-db`) directly via a Workers binding. In local dev without `wrangler`, the D1 binding is unavailable — use `npm run wrangler:dev` for full local integration, or run `npm run dev` for frontend-only work.
- E2E tests mock the `/api/prices` endpoint, so no external access is required for testing.
- Ensure the codebase is correctly formatted by running `npm run format`. The project should ideally pass `npm run lint` without requiring manual fixes for pre-existing issues.
- The `svelte-kit sync` step (part of `npm run check`) generates `.svelte-kit/` types. A `tsconfig.json` warning about missing `.svelte-kit/tsconfig.json` on first `vitest run` is harmless — it resolves after running `npm run check` or `npm run dev` once.
- No Docker or external database setup is required for local development.
