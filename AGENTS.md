# AGENTS.md

## Cursor Cloud specific instructions

This is a frontend-only SvelteKit / Svelte 5 app (Singapore HDB resale price prediction tool). No backend or database to manage locally.

### Key commands

All commands use **Bun** (lockfile: `bun.lock`). See `package.json` `"scripts"` for the full list.

| Task         | Command                                                 |
| ------------ | ------------------------------------------------------- |
| Install deps | `bun install`                                           |
| Dev server   | `bun run dev` (serves at `http://localhost:5173`)       |
| Lint         | `bun run lint` (Prettier + ESLint)                      |
| Format       | `bun run format`                                        |
| Type check   | `bun run check`                                         |
| Unit tests   | `bun run test:unit` (Vitest)                            |
| E2E tests    | `bun run test:e2e` (Playwright, mocks the external API) |
| Build        | `bun run build`                                         |

### Non-obvious caveats

- Bun should be installed and available on the PATH. It is recommended to use the bun command directly in configurations rather than hardcoded paths like `~/.bun/bin/bun` to ensure portability.
- Playwright browsers must be installed separately after `bun install`: `bunx playwright install --with-deps chromium`.
- The external prediction API (`https://ee4802-g20-tool.shenghaoc.workers.dev/api/prices`) is a hosted Cloudflare Worker. E2E tests mock this endpoint, so no external access is required for testing.
- Ensure the codebase is correctly formatted by running `bun run format`. The project should ideally pass `bun run lint` without requiring manual fixes for pre-existing issues.
- The `svelte-kit sync` step (part of `bun run check`) generates `.svelte-kit/` types. A `tsconfig.json` warning about missing `.svelte-kit/tsconfig.json` on first `vitest run` is harmless — it resolves after running `bun run check` or `bun run dev` once.
