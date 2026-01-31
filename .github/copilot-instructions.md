
# AI Copilot Instructions for ray-bakes

## Project Overview
Ray Bakes is a Next.js 16 bakery order management system with a public order interface and an admin dashboard. It uses Supabase for authentication and data, Tailwind CSS for styling, and Radix UI for accessible components.

## Architecture & Data Flow
- **Framework**: Next.js 16 (App Router, TypeScript strict mode)
- **UI**: Radix UI primitives, custom-styled in [components/ui/](components/ui/), composed with Tailwind 4 utility classes
- **Database/Auth**: Supabase (PostgreSQL backend, email/password auth)
- **Pages**: All routes in [app/](app/) use the App Router. Client components (with `"use client"`) manage state and call Supabase directly.
- **Order Model**: See [app/admin/page.tsx](app/admin/page.tsx) for the `Order` interface and nested item structure. Orders are fetched with SQL-style string queries for nested data.

## Key Workflows
- **Authentication**: Always check Supabase session in admin pages (`useEffect`), redirect to `/login` if not authenticated. Login uses `supabase.auth.signInWithPassword()`.
- **Admin Dashboard**: Fetches orders (with nested items), supports filtering, sorting, inline editing (with backup/cancel), and CSV export. See [app/admin/page.tsx](app/admin/page.tsx).
- **Supabase Client**: Use the singleton from [lib/supabaseClient.ts](lib/supabaseClient.ts). Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.

## Development & Build
- `npm run dev` — Start dev server (localhost:3000, hot reload)
- `npm run build` — Production build
- `npm run start` — Run production build locally
- `npm run lint` — Run ESLint (see [eslint.config.mjs](eslint.config.mjs))

## Patterns & Conventions
- **UI Components**: Use/reuse primitives in [components/ui/](components/ui/). Compose with Tailwind classes and the `cn()` utility ([lib/utils.ts](lib/utils.ts)).
  - Example: `className={cn("px-4 py-2", isActive && "bg-blue-500")}`
- **State**: Use React `useState` and `useEffect` for local/async state. No external state libraries.
- **Supabase**: Always destructure `{ data, error }` and check for errors before using data. Use SQL-style string queries for nested selects.
- **Styling**: Tailwind 4 only (no CSS-in-JS). Prefer utility classes over inline styles.
- **Type Safety**: Define interfaces for API responses. Use `React.ReactNode` for children props.
- **Path Aliases**: `@/*` resolves to project root (e.g., `@/lib/supabaseClient` → `./lib/supabaseClient.ts`).

## Agent-Specific Guidance
1. **Always validate Supabase session in admin features.**
2. **Require `.env.local` with Supabase keys for local dev.**
3. **Do not mix server/client logic in the same file.**
4. **Follow Radix UI + Tailwind patterns from [components/ui/](components/ui/) for new UI.**
5. **Display Supabase errors to users (see login/admin pages).**
6. **Reference [app/admin/page.tsx](app/admin/page.tsx) for advanced data fetching, filtering, and editing patterns.**

---
If any conventions or workflows are unclear, ask for clarification or examples from the codebase.
