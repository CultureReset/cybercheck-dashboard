# cybercheck-dashboard

The CyberCheck monorepo: the original vanilla-JS business dashboard, its Express + Supabase backend, the Circle Boats rental site, and Profile OS, a Next.js builder where a business assembles its public page from app blocks.

The dashboard and backend here are the older generation. Today's business dashboard is [`Dashboards-users-`](https://github.com/CultureReset/Dashboards-users-) and today's API is [`gcr-api-clean`](https://github.com/CultureReset/gcr-api-clean). Profile OS was the newest work in this repo, in October 2026.

## What is in it

| Folder | What it is |
|---|---|
| `cybercheck-dashboard-platform/` | One dashboard for every kind of business. Plain HTML and JavaScript pages that read and write through the backend |
| `cybercheck-backend-api/` | Express API on Supabase, with SQL for tables and row-level security so each business sees only its own data |
| `circle-boats-website/` | The Circle Boats customer site, a working example of a business site on this backend |
| `profile-os/` | Next.js app: a business picks installable app blocks and publishes them as its public page |

## Run it

Each folder runs on its own. The backend needs Supabase credentials in its own `.env`; the static folders can be served as-is. Profile OS is a standard Next.js app (`npm install && npm run dev` inside `profile-os/`).

Branches: `fix/profile-os-polish` has later Profile OS work; `master` is an earlier state.
