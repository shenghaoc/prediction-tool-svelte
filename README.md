# Prediction Tool Svelte

SvelteKit / Svelte 5 port of the original React `prediction-tool` repo. This variant keeps feature parity with the upgraded source app while using Svelte-native UI components, an SVG trend chart, and local persistence for form values, theme, and language.

The app lets a user enter a flat profile and get:

- an estimated resale price
- a 12-month trend view for that scenario
- a lightweight bilingual interface (`en` / `zh`)
- persisted form, theme, and language preferences in local storage

## Background

`prediction-tool` is the original repository and the React / Next.js implementation of the project. This repository is the SvelteKit / Svelte 5 port.

The original project was built for an EE4802 minor project and uses regression models only. There is no Python model-serving backend. The frontend submits a JSON request to the local `/api/prices` server route, which queries a Cloudflare D1 database directly using the pre-trained model coefficients and returns predicted prices.

Because of the way the original project data/model pipeline works, the tool does not forecast arbitrary future dates. It works against the fixed prediction window backed by the D1 database.

## Stack

- Svelte 5
- SvelteKit 2
- TypeScript
- ESLint + Prettier
- custom CSS
- SVG-based trend chart rendering
- Day.js for date handling
- Cloudflare Workers (`@sveltejs/adapter-cloudflare`)
- Cloudflare D1 (prediction model coefficients)

## App Structure

- [src/routes/+page.svelte](./src/routes/+page.svelte)
- [src/routes/api/prices/+server.ts](./src/routes/api/prices/+server.ts) — prediction API route (D1 query)
- [src/lib/stores/prediction.ts](./src/lib/stores/prediction.ts)
- [src/lib/components/prediction](./src/lib/components/prediction)
- [src/lib/prediction.ts](./src/lib/prediction.ts)
- [src/lib/i18n.ts](./src/lib/i18n.ts)
- [src/lib/lists.ts](./src/lib/lists.ts)
- [wrangler.jsonc](./wrangler.jsonc) — Cloudflare Workers config with D1 binding

## Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The default local URL is:

```text
http://localhost:5173
```

For local development with D1 bindings, use wrangler:

```bash
npm run wrangler:dev
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run check
npm run lint
npm run format
npm run test:unit
npm run test:e2e
npm run deploy
npm run cf-typegen
```

## Deployment

The app is deployed to Cloudflare Workers via `@sveltejs/adapter-cloudflare`:

```bash
npm run deploy
```

The D1 database binding (`DB`) maps to `ee4802-g20-tool-db`.

## Notes

- The prediction request is sent to the local `/api/prices` server route, which queries D1 directly.
- Theme, language, and form values are persisted locally in the browser.
- The chart is rendered as SVG to avoid client-only canvas/chart bootstrapping issues in SvelteKit.
- This variant intentionally keeps a lightweight custom SVG chart (instead of a heavier chart framework) to match Svelte's minimal runtime style.

## Testing

- Vitest unit tests cover prediction utilities and the server hook.
- Playwright e2e tests cover the main page flow with the prediction API mocked.

## Status

This is no longer the default SvelteKit starter. The repository has been converted into a project-specific SvelteKit / Svelte implementation of the original `prediction-tool` app.
