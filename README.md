# cybercheck-dashboard

> Status: active in October 2026 (commits in the last 30 days: nine `profile-os/` commits, last real work 2026-10-28) — role unconfirmed. The other three folders were last touched 2026-02-28. **This is a PUBLIC GitHub repository.** An earlier version of this README labelled three of four folders "archive-candidate"; they are older-generation code whose overlap with `gcr-api-clean` and the current dashboards is a judgment from reading the code, not a byte-for-byte duplicate. Last verified against code 2026-11-02 (commit dc39829).

## What it is

A grab-bag repo of four independent folders. They share no build system.

| Folder | What it is | Last touched |
| --- | --- | --- |
| `profile-os/` | Next.js 16 block-driven public profile + studio prototype on an isolated `profile_os` Supabase schema. See its own README. | 2026-10-28 |
| `cybercheck-backend-api/` | Early Express "multi-tenant" API (Supabase, Stripe Connect, OAuth). 218 `router.METHOD(` registrations by grep, of which 24 are in `routes/site.js`, which `server.js` never mounts, so 194 are live plus `/api/health` (its README says 100+ dashboard endpoints; `routes/dashboard.js` alone has 117). Has its own `schema.sql`. | 2026-02-28 |
| `cybercheck-dashboard-platform/` | Early static HTML/JS dashboard (tabs, `js/`, `login.html`). | 2026-02-28 |
| `circle-boats-website/` | Static customer site for a boat-rental business (booking, cart, tracking). | 2026-02-28 |

## Where it fits

- The current platform is `gcr-api-clean` (API) plus `Admin-dashboard-main` and `Dashboards-users-` (UIs that call only that API). The three February folders here predate it. Reading the code, they look like earlier versions of what `gcr-api-clean` and `Dashboards-users-` now do (they use their own bcrypt/JWT auth and their own Supabase project), but nothing shows they are retired; whether any is still deployed is unverified.
- **`cybercheck-dashboard-platform/js/supabase-client.js` embeds a Supabase URL and an anon-role key for a Supabase project (ref `mhafixflyffflwjhcgfn`, not the `cyber check` ref) and the dashboard uses it from the browser.** That breaks the rule that only `gcr-api-clean` touches the database and that no UI holds a Supabase key. An anon key is public by design, but this repository is PUBLIC and the key is at `cybercheck-dashboard-platform/js/supabase-client.js:5` (and in git history), so anyone can read it and query whatever that project's grants and RLS allow. Other committed keys, path and kind only: a Stripe test publishable key and an OpenWeather key in browser JS in `circle-boats-website/index.html` (around lines 3615-3633 and 4070), and real-looking customer data (owner contact, business name, plan) in `cybercheck-dashboard-platform/config.js` as an offline fallback.
- `cybercheck-backend-api/` talks to Supabase directly (`@supabase/supabase-js`); it is not `gcr-api-clean`.
- `profile-os/` uses Supabase directly from its own server routes (service role) and browser auth; it is not wired to `gcr-api-clean` either.

## Run / test

Per-folder, unverified (nothing was run in this pass):

- `profile-os/`: `npm install`, `npm run dev`, `npm run typecheck` (see its README).
- `cybercheck-backend-api/`: `npm start` / `npm run dev` per its `package.json`; needs a Supabase project and env vars (see its README).
- `cybercheck-dashboard-platform/`, `circle-boats-website/`: static files, open `index.html`; the dashboard needs its Supabase backend to do anything.

No tests were found in any folder.

## Known gaps

- Mixed-age code with no root build or documentation until now.
- Embedded Supabase anon key in a browser bundle (above).
- The February folders are not maintained; deployment status is unverified.
- `cybercheck-backend-api`: the Stripe webhook skips signature verification when `STRIPE_WEBHOOK_SECRET` is unset (`routes/webhooks.js:14-29`); the `/twilio` and `/google` webhooks have no signature check; CORS defaults to `*` with credentials; `routes/admin.js:17-21` builds a PostgREST `.or()` filter from the raw username; 26 TODO markers.
- `circle-boats-website` needs a backend that serves `/api/public/*` and `/api/stripe/*` on the same origin; `server.js` of the backend serves `../beachside-site`, `../beachside-dashboard`, `../admin`, `../public`, `../sites`, none of which exist in this repo.
- Branches: `fix/profile-os-polish` carries open PR #1 (unmerged, see `profile-os/README.md`); `master` is an unrelated-history copy of the static dashboard from 2026-03-02.
- `profile-os/` gaps are listed in its README.

## Related repos

- `gcr-api-clean`, `Admin-dashboard-main`, `Dashboards-users-`: the current API and UIs.
- `cybercheck-login`: another old static dashboard (earlier generation than `Dashboards-users-`; not verified as retired).
- `nextgent-modules`: a similar module/profile prototype.

## Inside this repo (from the code)

Read from source at commit dc39829; nothing was executed, so runtime claims are unverified. 150 tracked files: html 16 files / 16,595 lines, js 51 / 14,921, sql 13 / 3,910, css 4 / 1,387; ts/tsx 31 files (very long lines). No CI, no tests anywhere, no root build.

**Directory map**
- `profile-os/` (47 files): Next 16.1.1 / React 19 app. `src/app` (pages `/[slug]`, `/login`, `/dashboard`, `/apps`, `/auth/confirm`, `/auth/signout`; 13 API route files), `src/proxy.ts` (auth refresh), `src/components/profile-renderer.tsx`, `supabase/migrations/0001`..`0006`. No `/` page on `main`.
- `cybercheck-backend-api/` (26 files, 8.7k lines): Express 4, port `PORT` or 3000, JWT auth with its own `users` table (not Supabase Auth). `routes/`: dashboard 117 routes, admin 25, public 21, gcr 9, auth 8, stripe 6, analytics 5, webhooks 3, site 24 (unmounted). A 2-minute `setInterval` deletes expired `booking_holds`. Three overlapping SQL schema sets (`schema.sql`, `schema-additions.sql`, `supabase/01..06`).
- `cybercheck-dashboard-platform/` (52 files, ~17k lines): vanilla-JS dashboard, hash router (`js/router.js`), 25 sidebar pages, `js/module-loader.js` per business type. 110 `supabase.from(...)` calls over 37 tables straight from the browser plus 8 `fetch` calls to the backend (`js/cc.js`, base `window.CC_API_BASE` or `http://localhost:3000`).
- `circle-boats-website/` (24 files): static site; `index.html` 4,570 lines plus two older copies (1,714 and 2,621 lines), `links.html`, `tracking.js`, 18 images (4.2 MB). Calls same-origin `/api/public/*`, `/api/stripe/*`, and OpenWeather.

**How it starts.** `profile-os`: `npm run dev|build|start|typecheck`; env names `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `N8N_PROFILE_LEAD_WEBHOOK_URL`. Backend: `npm start`; env names `CORS_ORIGINS`, `JWT_SECRET`, `PLATFORM_FEE_PERCENT`, `STRIPE_*`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `TWILIO_*`. The two static folders have no build.

**Data.** `profile-os` uses its own `profile_os` schema (34 tables, 13 referenced by code) with the service-role key from server routes; no project ref in the repo. The dashboard and backend point at a different Supabase project (ref `mhafixflyffflwjhcgfn`), not `cyber check`. Nothing here calls `gcr-api-clean`; all of it talks to Supabase directly, which breaks the architecture rule, but none of it targets the live `cyber check` project as far as the code shows.

**Integrations.** Supabase, Stripe (Connect and payment intents, backend only), Twilio (SMS, STOP handling in `routes/webhooks.js`), optional n8n lead webhook (profile-os), OpenWeather. No imports from any other CultureReset repo.

**Stubbed or dead.** `routes/site.js` (24 routes) never mounted; `sharp` declared but unused; the Google webhook is a TODO stub; `config.js` hard-codes demo owner data; `profile-os` has 11 of 18 modules as placeholders and 19 of 34 tables with no code path; `zod` is declared and never imported; `tsconfig.tsbuildinfo` is committed.

**Unique here.** The organization -> profiles -> blocks data model with goal-based app recommendations (`profile-os`), and an early reference for booking holds, Stripe Connect and SMS STOP handling (`cybercheck-backend-api/routes/public.js`, `webhooks.js`).
