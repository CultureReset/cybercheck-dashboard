# CyberCheck Profile OS

Modular public profiles and an owner **Profile Studio** for local businesses. Install apps, stack Lego-like blocks, manage content — restaurants, artists, realtors, and hybrids on one engine (no business-type template fork).

Package: `cybercheck-profile-os` · Next.js 16 · React 19 · Supabase (`profile_os` schema)

---

## What the owner gets

1. **Public page** `/{slug}` — phone-width dark profile with hero, quick actions, and rendered content blocks.
2. **Studio** `/dashboard` (after `/login`) — goals, App Marketplace, block stack, content managers, profile switcher, **View public page**.
3. **App Builder** `/apps` — publish private versioned app packages (approved block components only; no arbitrary JS).
4. **Landing** `/` — links to demo profiles and sign-in.

### Demo profiles

| Slug | Kind (metadata only) | Visitor experience |
|------|----------------------|--------------------|
| `/tide-table-demo` | restaurant | Menu, happy hour, events; shop falls back to catalog entries when no `products` rows |
| `/wave-room-demo` | artist | Live session card (request CTA hidden until wired), shows, merch |
| `/coast-key-demo` | realtor | Listings, open houses, working valuation lead form |

---

## App / block system

- **`profile_modules`** = installed apps · **`profile_blocks`** = ordered public sections.
- **`entity_kind` never decides apps or payload** — only installed modules + block visibility.
- Public reads: server service-role → `public.cc_get_profile_payload(slug)` (execute for `service_role` only).
- Studio writes: session cookie → membership + **write role** (`owner` | `admin` | `editor`) → service-role DB.

### Public renderers vs Coming soon

**Rendered on the public page:** `menu`, `catalog`, `shop`, `events`, `live_session`, `lead_forms`, `specials` (+ custom apps whose manifest `component` maps to these).

**Coming soon** (studio marketplace; **not** shown as public placeholder blocks): `booking`, `reviews`, `gallery`, `sms_opt_in`, `analytics`, `tips`, `content_wall`, `loyalty`, `ai_media`, `team`.

`quick_actions` powers the action nav, not a stack block.

---

## Security & rate limits

- Schema `profile_os` isolated; RLS on all tables.
- Migration **`0007_profile_os_role_split_rls.sql`**: members **SELECT**; **INSERT/UPDATE/DELETE** require `owner`/`admin`/`editor` via `profile_os.can_write_org()`.
- Studio APIs call `requireWriteAccess` / `canWriteRole` — viewers get **403** on writes and a read-only studio banner.
- In-memory per-IP rate limits on `GET /api/public/[slug]` (60/min) and `POST /api/public/[slug]/forms` (10/min). **Production needs a shared store** (Redis / Upstash / edge KV); this process-local map does not coordinate across instances.

---

## Setup

```bash
cd profile-os
npm install
cp .env.example .env.local
```

Apply migrations `0001`–`0007` in order. Expose `profile_os` to PostgREST. Set:

```env
SUPABASE_URL=…
SUPABASE_SERVICE_ROLE_KEY=…          # server only
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=…
# optional
N8N_PROFILE_LEAD_WEBHOOK_URL=
```

```bash
npm run dev      # http://localhost:3010
npm run build
npm run typecheck
```

Without keys, DB routes throw `Missing server Supabase environment variables`.

---

## Ecosystem

| System | Fit |
|--------|-----|
| **CyberCheck** | Older brand; this is the Next.js + `profile_os` public/studio surface. |
| **GCR** | Regional directory — Profile OS slugs are natural detail pages (no in-repo GCR wiring yet). |
| **NEXT GENT** | Managed AI workforce on a customer-owned Linux box (Jarvis, Paperclip, Android phone, receipts). Profile OS is a surface agents could operate; `audit_log` / analytics exist; no Jarvis wiring in this package. |
| **Ghost** | Not referenced here. |

---

## Recent polish (branch `fix/profile-os-polish`)

- Import `globals.css` in root layout.
- Shop empty `products[]` falls back to catalog `entries`.
- Studio lists **all** org profiles and persists selection in `localStorage`.
- Share uses `navigator.share` / clipboard; **See all** and Live **Request** CTAs removed until wired.
- **operations** marketplace filter; Coming soon apps; welcome empty state when only defaults installed.
- Lead form captures the form element before `await` (no `reset` null error).
- Landing `/`; RLS role split + studio role checks; public rate limits; View public page link.
