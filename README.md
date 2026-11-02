# cybercheck-dashboard

> Status: archive-candidate for three of the four folders; `profile-os/` is an idea/prototype — last verified against code 2026-11-02 (commit dc39829)

## What it is

A grab-bag repo of four independent folders. They share no build system.

| Folder | What it is | Last touched |
| --- | --- | --- |
| `profile-os/` | Next.js 16 block-driven public profile + studio prototype on an isolated `profile_os` Supabase schema. See its own README. | 2026-10-28 |
| `cybercheck-backend-api/` | Early Express "multi-tenant" API (Supabase, Stripe Connect, OAuth). About 219 `app.`/`router.` route registrations by grep (its README says 100+ dashboard endpoints). Has its own `schema.sql`. | 2026-02-28 |
| `cybercheck-dashboard-platform/` | Early static HTML/JS dashboard (tabs, `js/`, `login.html`). | 2026-02-28 |
| `circle-boats-website/` | Static customer site for a boat-rental business (booking, cart, tracking). | 2026-02-28 |

## Where it fits

- The current platform is `gcr-api-clean` (API) plus `Admin-dashboard-main` and `Dashboards-users-` (UIs that call only that API). The three February folders here predate it and were superseded by it; treat them as history.
- **`cybercheck-dashboard-platform/js/supabase-client.js` embeds a Supabase URL and an anon-role key for a Supabase project (ref `mhafixflyffflwjhcgfn`, not the `cyber check` ref) and the dashboard uses it from the browser.** That breaks the rule that only `gcr-api-clean` touches the database and that no UI holds a Supabase key. An anon key is public by design, but it is in git history of this repo.
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
- `profile-os/` gaps are listed in its README.

## Related repos

- `gcr-api-clean`, `Admin-dashboard-main`, `Dashboards-users-`: the current API and UIs.
- `cybercheck-login`: another old static dashboard (superseded by `Dashboards-users-`).
- `nextgent-modules`: a similar module/profile prototype.
