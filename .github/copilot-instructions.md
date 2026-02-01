# AI Copilot Instructions — ray-bakes
# AI Copilot Instructions — ray-bakes

Purpose: concise, repo-specific guidance to help coding agents be productive.

## Big picture
- This is a Next.js (v16) app using the App Router — primary routes live under `app/`.
- Components in `components/ui/` are UI primitives; most components are server components by default. Files that begin with `"use client"` are client components (e.g., `app/admin/page.tsx`, `components/ui/navbar.tsx`).
- Supabase is the backend: client is created in `lib/supabaseClient.ts` and is used directly from client components.

## Key workflows (commands)
- `npm run dev` — start Next dev server (localhost:3000).
- `npm run build` && `npm run start` — build and run production.
- `npm run lint` — run ESLint (config in `eslint.config.mjs`).

## Project conventions & patterns
- Path alias: `@/*` → project root (see `tsconfig.json`). Prefer imports like `@/lib/supabaseClient`.
- Client vs Server boundary: maintain separation. Browser APIs (`window`, `Blob`, `document`, CSV download) appear in client components (notably `app/admin/page.tsx`). Do not move browser-only code into server components.
- UI primitives: reuse components from `components/ui/`. Some components (e.g., `components/ui/navbar.tsx`) use inline styles and lightweight DOM-style handlers (`data-original-style` and `style.cssText`) for hover/active effects — copy this pattern only for similar low-level interactions.

## Supabase & data patterns
- Single client entry: `lib/supabaseClient.ts` — expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` for local development.
- Typical queries: nested selects (e.g., `orders` with `order_items (...)`) are read then normalized on the client to compute aggregates like totals.
- Admin updates: the current pattern deletes existing `order_items` rows then inserts new ones. When changing this flow, ensure operations are error-checked and consistent (client-side sequence can cause partial updates).

## Files to inspect for examples
- Auth & admin flows: `app/admin/page.tsx` (session checks, nested selects, CSV export)
- UI examples: `components/ui/navbar.tsx`, `components/ui/button.tsx`, `components/ui/card.tsx`
- Supabase client: `lib/supabaseClient.ts`

## What to avoid / gotchas
- Do not assume a separate backend service — Supabase is used directly from the app.
- Avoid moving browser-only logic into server components.
- Inline-style DOM manipulations exist in the navbar — if refactoring, keep the `data-original-style` pattern or port behavior carefully.

If you want more detail on any of the examples above (line-level snippets, alternate refactor suggestions, or tests to add), tell me which area and I will expand.
