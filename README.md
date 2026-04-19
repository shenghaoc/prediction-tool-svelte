# Prediction Tool Svelte

SvelteKit / Svelte 5 port of the original React `prediction-tool` repo. This variant keeps feature parity with the upgraded source app while using Svelte-native UI components, an SVG trend chart, and local persistence for form values, theme, and language.

The app lets a user enter a flat profile and get:

- an estimated resale price
- a 12-month trend view for that scenario
- a lightweight bilingual interface (`en` / `zh`)
- persisted form, theme, and language preferences in local storage

## Background

`prediction-tool` is the original repository and the React / Next.js implementation of the project. This repository is the SvelteKit / Svelte 5 port.

The original project was built for an EE4802 minor project and uses regression models only. There is no Python model-serving backend in this repo. The frontend submits form data to the existing prediction API endpoint and renders the returned trend data.

Because of the way the original project data/model pipeline works, the tool does not forecast arbitrary future dates. It works against the fixed prediction window exposed by the upstream API.

## Stack

- Svelte 5
- SvelteKit 2
- TypeScript
- ESLint + Prettier
- custom CSS
- SVG-based trend chart rendering
- Day.js for date handling

## App Structure

- [src/routes/+page.svelte](./src/routes/+page.svelte)
- [src/lib/stores/prediction.ts](./src/lib/stores/prediction.ts)
- [src/lib/components/prediction](./src/lib/components/prediction)
- [src/lib/prediction.ts](./src/lib/prediction.ts)
- [src/lib/i18n.ts](./src/lib/i18n.ts)
- [src/lib/lists.ts](./src/lib/lists.ts)

## Development

Install dependencies with Bun:

```bash
bun install
```

Start the development server:

```bash
bun run dev
```

The default local URL is usually:

```text
http://localhost:5173
```

## Scripts

```bash
bun run dev
bun run build
bun run preview
bun run check
bun run lint
bun run format
bun run test:unit
bun run test:e2e
```

## Notes

- The prediction request is sent to `https://ee4802-g20-tool.shenghaoc.workers.dev/api/prices` (see `src/lib/stores/prediction.ts`).
- Theme, language, and form values are persisted locally in the browser.
- The chart is rendered as SVG to avoid client-only canvas/chart bootstrapping issues in SvelteKit.
- This variant intentionally keeps a lightweight custom SVG chart (instead of a heavier chart framework) to match Svelte's minimal runtime style.

## Testing

- Vitest unit tests cover prediction utilities and the server hook.
- Playwright e2e tests cover the main page flow with the prediction API mocked.

## Deployment

This repo intentionally keeps `@sveltejs/adapter-auto` because it’s deployed across multiple targets (Vercel, Cloudflare, Netlify).

If one deployment target becomes the permanent home for this repo later, switching to the platform-specific adapter is still worthwhile for target-specific options and slightly leaner CI installs.

## Status

This is no longer the default SvelteKit starter. The repository has been converted into a project-specific SvelteKit / Svelte implementation of the original `prediction-tool` app.
