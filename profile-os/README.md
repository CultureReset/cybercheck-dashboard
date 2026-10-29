# CyberCheck Profile OS

The modular public-profile foundation for CyberCheck, GCR, artist pages, restaurants, venues, realtors, charters, shops, and hybrids.

## What is implemented

- Next.js public route: `/:slug`
- Server-only public-profile API: `/api/public/:slug`
- Dashboard shell: `/dashboard`
- Module registry with 18 installable applications
- Isolated `profile_os` Supabase schema with 33 tables
- RLS on every Profile OS table
- Server-only RPC gateway for published profile payloads
- Three test profiles: `tide-table-demo`, `wave-room-demo`, and `coast-key-demo`

## Database model

`profile_blocks` decides the public page order. `profile_modules` decides which applications are installed. Module tables hold real data: menus, events, bookings, products, live sessions, reviews, forms, CRM contacts, and analytics.

The `catalog_entries` table is a shared search/card layer. It does not replace the specific tables. A menu item remains a `menu_items` record; a shirt remains a `products` + `product_variants` record; a property remains a property-type catalog entry until the dedicated property module is added.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only on the server.
3. Run `npm install` and `npm run dev`.
4. Open `/tide-table-demo`, `/wave-room-demo`, or `/coast-key-demo`.

## Security boundary

`profile_os` remains an internal Postgres schema. Browser clients do not get the service-role key and do not write to tables directly. Public pages call server routes, which use `public.cc_get_profile_payload` with a service-role key. Dashboard write routes are the next implementation step and must enforce the authenticated organization membership before calling service-role database code.

## Next build slices

1. Authenticated dashboard profile selector and module enable/disable route.
2. Replace generic block placeholders with Menu, Events, Catalog, and Gallery components.
3. Add public form submission, QR scan, and analytics event endpoints with rate limits.
4. Add Stripe Connect checkout/webhooks, then booking normalization and live voting realtime.
