# Prediction Tool Svelte

SvelteKit port of the upgraded HDB resale prediction tool. The app keeps feature parity with the React/Next.js version while using Svelte-native UI components, a reactive SVG chart, and local state persistence for form values, theme, and language.

## Features

- bilingual UI (`en` / `zh`) with persisted language preference
- dark and light themes with persisted theme preference
- reusable custom listbox controls and a lease-year slider
- predicted resale price output with a 12-month trend chart
- client-side validation and saved form state between visits

## Tech stack

- Svelte 5
- SvelteKit 2
- TypeScript
- Bun for local scripts
- Day.js for date handling

## Development

Install dependencies:

```bash
bun install
```

Run the app locally:

```bash
bun run dev
```

Useful scripts:

```bash
bun run check
bun run lint
bun run format
bun run build
bun run preview
bun run test:unit
bun run test:e2e
```

## Project structure

```text
src/routes/+page.svelte                         # page shell and top-level wiring
src/lib/stores/prediction.ts                   # prediction state, persistence, submit logic
src/lib/components/prediction/                 # form, results, chart, and UI primitives
src/lib/prediction.ts                          # shared types, defaults, normalization, theming
src/lib/i18n.ts                                # translations and language helpers
src/lib/lists.ts                               # prediction option lists
```

## Prediction API

The form currently posts to:

```text
https://ee4802-g20-tool.shenghaoc.workers.dev/api/prices
```

If you want to point the app at a different backend, update the `fetch` call in `src/lib/stores/prediction.ts`.

## Testing

The repo now includes:

- Vitest unit tests for prediction utilities and the language hook
- Playwright end-to-end coverage for the main page flow with the prediction API mocked

## Deployment notes

This repo intentionally keeps `@sveltejs/adapter-auto`.

That is the right choice if you want the same SvelteKit app to stay portable across supported platforms such as:

- Vercel
- Cloudflare
- Netlify

If one deployment target becomes the permanent home for this repo later, switching to the platform-specific adapter is still worthwhile for target-specific options and slightly leaner CI installs.
