# CyberCheck Profile OS

> Status: active in October 2026 (commits in the last 30 days: nine commits through 2026-10-28) — role unconfirmed; prototype, not shown to be deployed. The substantive fixes (role-split RLS, rate limits, landing page) exist only on branch `fix/profile-os-polish`, **open PR #1, unmerged**; this README describes `main`. Last verified against code 2026-11-02 (commit dc39829).

## What it is

A Next.js 16 / React 19 app (inside the `cybercheck-dashboard` repo, folder `profile-os/`) for modular public profiles (artists, restaurants, venues, realtors, charters, shops, hybrids).

- Public page `/:slug` renders an ordered list of blocks; `/api/public/:slug` serves the payload from `public.cc_get_profile_payload`, a Postgres function granted to `service_role` only (migrations `0003`, `0004`).
- Isolated Supabase schema `profile_os`: 34 tables (33 in `0001_profile_os_foundation.sql`, 1 in `0006_profile_os_app_packages.sql`), with RLS using `profile_os.is_org_member(...)`. `profile_blocks` sets page order, `profile_modules` sets installed apps, 18 module rows are seeded in `0001`, and `0004` adds the `manifest` column and `0006` adds one table (`module_versions`), but no platform module row has a manifest (all 18 are `'{}'`), so "manifest-driven" is true only for custom apps created in `/apps`. Demo profiles `tide-table-demo`, `wave-room-demo`, `coast-key-demo` come from `0002`.
- Studio (`/dashboard`, `/apps`, `/login`) with authenticated write routes under `/api/studio/*` (profiles, modules, blocks, content, apps, onboard). Those routes check Supabase sign-in and organization membership in `src/lib/studio.ts`, but **not the member's role**: a `viewer` can write on `main` (30 tables carry one `member_access` FOR ALL policy; the service-role key bypasses RLS anyway). Role-based writes are only on the unmerged PR #1 branch.
- Public `POST /api/public/:slug/forms` (lead form) and `GET /api/public/:slug/actions` (click tracking + redirect).

## Where it fits

- Nothing found calls it, and it does not call `gcr-api-clean`.
- **It breaks the architecture rule**: it talks to Supabase directly with a server-side service-role key (`src/lib/supabase-server.ts`) and uses Supabase Auth from the browser with the publishable key (`src/lib/supabase-browser.ts`). Only `gcr-api-clean` should touch the live cloud database `cyber check`; which Supabase project this app targets is not stated in the repo (`SUPABASE_URL` is read from env).
- Overlaps the module/profile ideas in `nextgent-modules`.

## Run / test

From `package.json` and `.env.example`; **not executed (unverified)**:

1. Copy `.env.example` to `.env.local`; variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Apply `supabase/migrations/0001`..`0006` to a non-production Supabase project.
3. `npm install`, `npm run dev`, open `/tide-table-demo`. Also `npm run typecheck`, `npm run build`.

There are no tests.

## Known gaps

- **11 of 18 modules are placeholders** that do nothing: `live_session`, `sms_opt_in`, `booking`, `reviews`, `gallery`, `analytics`, `tips`, `content_wall`, `loyalty`, `ai_media`, `team` render static text or buttons with no network call (`src/components/profile-renderer.tsx`). The real ones are `catalog`, `menu`, `shop`, `events`, `specials`, `lead_forms` plus quick-action buttons. `tips` says "Stripe Connect" but there is no Stripe code.
- **New profiles can never be published.** Onboarding creates `status='draft', is_public=false` and no code on `main` sets a profile public; only the three SQL-seeded demos are public, so "View page" for a new profile 404s.
- The real fixes sit in **open PR #1 (`fix/profile-os-polish`, unmerged)**: migration `0007_profile_os_role_split_rls.sql`, in-memory rate limiting (`src/lib/rate-limit.ts`), a `/` landing page, hiding placeholder blocks publicly. It does not fix the open redirect.
- There is no `/` page on `main`. 19 of the 34 tables have no code path; `zod` is declared and never imported.
- Open redirect: `GET /api/public/:slug/actions?href=` redirects to any `http(s):`, `tel:` or `mailto:` URL it is given, with no allow-list.
- No rate limiting on the public lead form or on the click-tracking endpoint (both write to the database); the old "add rate limits" next step is still open.
- Payments (Stripe Connect), booking normalization and live-voting realtime from the earlier plan are not implemented.
- No tests. Deployed/production status is unverified.

## Related repos

- `gcr-api-clean`: the real API and DB gateway.
- `nextgent-modules`: similar module-registry prototype.
- `Dashboards-users-` / `Admin-dashboard-main`: the current dashboards.

## Inside this repo (from the code)

Read from source at commit dc39829; nothing executed, runtime behaviour unverified.

- **Shape.** 47 files, Next 16.1.1 with `typedRoutes`, React 19.2.3, `@supabase/ssr`, `@supabase/supabase-js`, `zod` (unused). Scripts: `dev`, `build`, `start`, `typecheck`. No tests, CI, Dockerfile or `vercel.json`. `src/proxy.ts` refreshes the Supabase session on all non-static paths.
- **Pages.** `/[slug]` public profile, `/login` (password sign-in/sign-up in the browser), `/dashboard` (ModuleStudio), `/apps` (AppBuilder), `/auth/confirm`, `/auth/signout`.
- **API (13 handler files).** `/api/public/[slug]` (GET; RPC `cc_get_profile_payload` via service role), `.../forms` (POST: lead insert, analytics insert, optional n8n webhook, fire-and-forget), `.../actions` (GET: click tracking then redirect), `/api/studio` (GET), `/api/studio/onboard` (POST), `/api/studio/apps` (GET/POST), `/api/studio/profiles/[id]` (PATCH), `.../modules`, `.../blocks`, `.../blocks/[blockId]`, `.../content` (catalog entries, events, menu items, products).
- **Studio.** Seven goal chips map to module sets; install toggle; block reorder; per-block title/style/headline; content manager for menu, shop, catalog, events, songs. App Builder lets a user publish a custom app from 6 approved components (`catalog`, `form`, `gallery`, `actions`, `content`, `events`) as `module_versions` 1.0.0; there is no review flow and no way to bump a version.
- **Data.** Schema `profile_os` (not exposed to the Data API; all access via service role), 34 tables, 13 referenced by code. Migrations: `0001` foundation, 18 module rows and RLS; `0002` three demo profiles; `0003` public gateway function; `0004` module columns and payload v2; `0005` `recommendation_goals`; `0006` publisher columns and `module_versions`. Not the `cyber check` schema; talks to Supabase directly, never through `gcr-api-clean`.
- **Env var names.** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `N8N_PROFILE_LEAD_WEBHOOK_URL`.
- **Risks on `main`.** Open redirect in `actions/route.ts`; unauthenticated, unrate-limited writes on forms and actions; viewer write access; the n8n lead webhook carries lead PII with no signature; service-role client created per request.
