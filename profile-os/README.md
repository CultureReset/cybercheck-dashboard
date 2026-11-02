# CyberCheck Profile OS

> Status: idea/prototype — last verified against code 2026-11-02 (commit dc39829)

## What it is

A Next.js 16 / React 19 app (inside the `cybercheck-dashboard` repo, folder `profile-os/`) for modular public profiles (artists, restaurants, venues, realtors, charters, shops, hybrids).

- Public page `/:slug` renders an ordered list of blocks; `/api/public/:slug` serves the payload from `public.cc_get_profile_payload`, a Postgres function granted to `service_role` only (migrations `0003`, `0004`).
- Isolated Supabase schema `profile_os`: 34 tables (33 in `0001_profile_os_foundation.sql`, 1 in `0006_profile_os_app_packages.sql`), with RLS using `profile_os.is_org_member(...)`. `profile_blocks` sets page order, `profile_modules` sets installed apps, 18 module rows are seeded in `0001`, and marketplace manifests / app packages are in `0004` and `0006`. Demo profiles `tide-table-demo`, `wave-room-demo`, `coast-key-demo` come from `0002`.
- Studio (`/dashboard`, `/apps`, `/login`) with authenticated write routes under `/api/studio/*` (profiles, modules, blocks, content, apps, onboard). Those routes check Supabase sign-in and organization membership in `src/lib/studio.ts`.
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

- Half the blocks are placeholders that do nothing: `live_session`, `sms_opt_in`, `booking`, `tips`, `loyalty` render static "ready" panels or buttons with no handler (`src/components/profile-renderer.tsx`).
- Open redirect: `GET /api/public/:slug/actions?href=` redirects to any `http(s):`, `tel:` or `mailto:` URL it is given, with no allow-list.
- No rate limiting on the public lead form or on the click-tracking endpoint (both write to the database); the old "add rate limits" next step is still open.
- Payments (Stripe Connect), booking normalization and live-voting realtime from the earlier plan are not implemented.
- No tests. Deployed/production status is unverified.

## Related repos

- `gcr-api-clean`: the real API and DB gateway.
- `nextgent-modules`: similar module-registry prototype.
- `Dashboards-users-` / `Admin-dashboard-main`: the current dashboards.
