-- CyberCheck Profile OS. Isolated from legacy tables in the same Supabase project.
-- All client writes must go through the CyberCheck API; service-role keys stay server-only.

create schema if not exists profile_os;
create extension if not exists pgcrypto with schema extensions;

create type profile_os.profile_status as enum ('draft', 'published', 'archived');
create type profile_os.member_role as enum ('owner', 'admin', 'manager', 'editor', 'staff', 'viewer');
create type profile_os.entry_type as enum ('service', 'listing', 'menu_item', 'product', 'song', 'package', 'property');
create type profile_os.order_status as enum ('draft', 'pending', 'paid', 'fulfilled', 'cancelled', 'refunded');
create type profile_os.booking_status as enum ('inquiry', 'hold', 'confirmed', 'cancelled', 'completed');

create table profile_os.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  stripe_connect_account_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profile_os.organization_members (
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role profile_os.member_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table profile_os.modules (
  key text primary key,
  name text not null,
  description text not null,
  version text not null default '1.0.0',
  public_route text,
  config_schema jsonb not null default '{}'::jsonb,
  is_active boolean not null default true
);

create table profile_os.profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  parent_profile_id uuid references profile_os.profiles(id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  entity_kind text not null default 'business',
  display_name text not null,
  legal_name text,
  short_description text,
  long_description text,
  logo_url text,
  cover_url text,
  theme jsonb not null default '{"accent":"#10b981","surface":"#ffffff","text":"#111827"}'::jsonb,
  primary_phone text,
  public_email text,
  website_url text,
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal_code text,
  country_code text not null default 'US',
  latitude numeric(9,6),
  longitude numeric(9,6),
  timezone text not null default 'America/Chicago',
  status profile_os.profile_status not null default 'draft',
  is_public boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, display_name)
);

create table profile_os.profile_domains (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  hostname text not null unique,
  is_primary boolean not null default false,
  verification_token text not null default encode(gen_random_bytes(18), 'hex'),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table profile_os.profile_modules (
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  module_key text not null references profile_os.modules(key),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  config jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default true,
  enabled_at timestamptz not null default now(),
  primary key (profile_id, module_key)
);

create table profile_os.profile_blocks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  module_key text not null references profile_os.modules(key),
  block_key text not null,
  title text,
  config jsonb not null default '{}'::jsonb,
  sort_order integer not null default 100,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, block_key)
);

create table profile_os.profile_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  label text not null,
  action_type text not null,
  href text not null,
  icon text,
  sort_order integer not null default 100,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table profile_os.media_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid references profile_os.profiles(id) on delete cascade,
  bucket text not null default 'profile-media',
  object_path text not null,
  public_url text,
  media_type text not null check (media_type in ('image', 'video', 'audio', 'document')),
  alt_text text,
  caption text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket, object_path)
);

create table profile_os.catalog_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  sort_order integer not null default 100,
  unique (profile_id, slug)
);

create table profile_os.catalog_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  category_id uuid references profile_os.catalog_categories(id) on delete set null,
  entry_type profile_os.entry_type not null,
  source_table text,
  source_id uuid,
  title text not null,
  slug text not null,
  summary text,
  description text,
  price_from numeric(12,2),
  currency char(3) not null default 'USD',
  status text not null default 'active',
  primary_image_url text,
  search_text tsvector generated always as (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(description, ''))) stored,
  sort_order integer not null default 100,
  is_public boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, slug)
);

create table profile_os.menu_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  catalog_entry_id uuid unique not null references profile_os.catalog_entries(id) on delete cascade,
  ingredients text,
  allergens text[] not null default '{}',
  dietary_tags text[] not null default '{}',
  modifier_groups jsonb not null default '[]'::jsonb,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profile_os.specials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  catalog_entry_id uuid references profile_os.catalog_entries(id) on delete set null,
  title text not null,
  description text,
  price numeric(12,2),
  starts_at timestamptz,
  ends_at timestamptz,
  weekly_schedule jsonb not null default '[]'::jsonb,
  restrictions text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table profile_os.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  title text not null,
  description text,
  cover_url text,
  event_kind text not null default 'event',
  venue_profile_id uuid references profile_os.profiles(id) on delete set null,
  is_public boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profile_os.event_occurrences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  event_id uuid not null references profile_os.events(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer,
  rsvp_count integer not null default 0,
  booking_url text,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table profile_os.form_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  name text not null,
  submit_label text not null default 'Submit',
  success_message text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table profile_os.form_fields (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  form_id uuid not null references profile_os.form_definitions(id) on delete cascade,
  field_key text not null,
  label text not null,
  field_type text not null,
  options jsonb not null default '[]'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  sort_order integer not null default 100,
  required boolean not null default false,
  unique (form_id, field_key)
);

create table profile_os.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  phone text,
  source text,
  consent_sms_at timestamptz,
  consent_email_at timestamptz,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profile_os.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  contact_id uuid references profile_os.contacts(id) on delete set null,
  form_id uuid references profile_os.form_definitions(id) on delete set null,
  status text not null default 'new',
  source text,
  payload jsonb not null default '{}'::jsonb,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profile_os.reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  contact_id uuid references profile_os.contacts(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text,
  status text not null default 'pending',
  is_verified boolean not null default false,
  public_name text,
  owner_response text,
  reviewed_at timestamptz not null default now()
);

create table profile_os.booking_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  catalog_entry_id uuid unique references profile_os.catalog_entries(id) on delete set null,
  duration_minutes integer,
  capacity integer not null default 1,
  booking_mode text not null default 'inquiry',
  external_booking_url text,
  created_at timestamptz not null default now()
);

create table profile_os.bookings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  service_id uuid references profile_os.booking_services(id) on delete set null,
  contact_id uuid references profile_os.contacts(id) on delete set null,
  starts_at timestamptz,
  ends_at timestamptz,
  party_size integer,
  status profile_os.booking_status not null default 'inquiry',
  source text not null default 'profile',
  external_confirmation_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profile_os.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  catalog_entry_id uuid unique references profile_os.catalog_entries(id) on delete set null,
  fulfillment_mode text not null default 'shipping',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table profile_os.product_variants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  product_id uuid not null references profile_os.products(id) on delete cascade,
  title text not null,
  sku text,
  price numeric(12,2) not null,
  inventory_quantity integer,
  options jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  unique (product_id, sku)
);

create table profile_os.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  contact_id uuid references profile_os.contacts(id) on delete set null,
  status profile_os.order_status not null default 'draft',
  currency char(3) not null default 'USD',
  subtotal numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  shipping_total numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  stripe_payment_intent_id text unique,
  pickup_code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profile_os.order_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  order_id uuid not null references profile_os.orders(id) on delete cascade,
  product_variant_id uuid references profile_os.product_variants(id) on delete set null,
  title_snapshot text not null,
  unit_price numeric(12,2) not null,
  quantity integer not null check (quantity > 0),
  metadata jsonb not null default '{}'::jsonb
);

create table profile_os.live_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  event_occurrence_id uuid references profile_os.event_occurrences(id) on delete set null,
  public_code text not null unique,
  title text not null,
  status text not null default 'scheduled',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table profile_os.live_session_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  session_id uuid not null references profile_os.live_sessions(id) on delete cascade,
  catalog_entry_id uuid references profile_os.catalog_entries(id) on delete set null,
  title text not null,
  sort_order integer not null default 100,
  vote_count integer not null default 0,
  request_count integer not null default 0,
  status text not null default 'available'
);

create table profile_os.live_votes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  session_id uuid not null references profile_os.live_sessions(id) on delete cascade,
  session_item_id uuid not null references profile_os.live_session_items(id) on delete cascade,
  visitor_token_hash text not null,
  vote_count integer not null default 1 check (vote_count > 0),
  payment_reference text,
  created_at timestamptz not null default now(),
  unique (session_item_id, visitor_token_hash)
);

create table profile_os.qr_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  live_session_id uuid references profile_os.live_sessions(id) on delete set null,
  code text not null unique,
  destination_path text not null,
  label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table profile_os.sms_opt_ins (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  contact_id uuid references profile_os.contacts(id) on delete set null,
  phone text not null,
  consent_text text not null,
  opted_in_at timestamptz not null default now(),
  opted_out_at timestamptz,
  source text not null default 'profile'
);

create table profile_os.analytics_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  profile_id uuid not null references profile_os.profiles(id) on delete cascade,
  event_name text not null,
  module_key text,
  block_key text,
  anonymous_visitor_id text,
  referrer text,
  utm jsonb not null default '{}'::jsonb,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table profile_os.audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references profile_os.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index catalog_entries_profile_type_idx on profile_os.catalog_entries(profile_id, entry_type, status) where is_public;
create index catalog_entries_search_idx on profile_os.catalog_entries using gin(search_text);
create index events_profile_starts_idx on profile_os.event_occurrences(profile_id, starts_at);
create index analytics_events_profile_time_idx on profile_os.analytics_events(profile_id, occurred_at desc);
create index bookings_profile_starts_idx on profile_os.bookings(profile_id, starts_at);
create index live_votes_session_idx on profile_os.live_votes(session_id, created_at desc);

create or replace function profile_os.is_org_member(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = profile_os, public as $$
  select auth.uid() is not null and exists (
    select 1 from profile_os.organization_members m
    where m.organization_id = target_organization_id and m.user_id = auth.uid()
  );
$$;
revoke all on function profile_os.is_org_member(uuid) from public;
grant execute on function profile_os.is_org_member(uuid) to authenticated;

alter table profile_os.organizations enable row level security;
alter table profile_os.organization_members enable row level security;

create policy organization_member_read on profile_os.organizations for select to authenticated using (profile_os.is_org_member(id));
create policy organization_member_read on profile_os.organization_members for select to authenticated using (profile_os.is_org_member(organization_id));

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','profile_domains','profile_modules','profile_blocks','profile_actions','media_assets',
    'catalog_categories','catalog_entries','menu_items','specials','events','event_occurrences',
    'form_definitions','form_fields','contacts','leads','reviews','booking_services','bookings',
    'products','product_variants','orders','order_items','live_sessions','live_session_items',
    'live_votes','qr_codes','sms_opt_ins','analytics_events','audit_log'
  ] loop
    execute format('alter table profile_os.%I enable row level security', table_name);
    execute format('create policy member_access on profile_os.%I for all to authenticated using (profile_os.is_org_member(organization_id)) with check (profile_os.is_org_member(organization_id))', table_name);
  end loop;
end $$;

alter table profile_os.modules enable row level security;
create policy module_registry_read on profile_os.modules for select to authenticated using (true);

insert into profile_os.modules (key, name, description, public_route) values
  ('quick_actions', 'Quick actions', 'Calls, texts, directions, booking and custom links.', null),
  ('catalog', 'Catalog', 'Universal listing, service, product and package cards.', '/catalog'),
  ('menu', 'Menu', 'Restaurant menu categories, modifiers and dietary fields.', '/menu'),
  ('specials', 'Specials & happy hour', 'Time-bound pricing and promotions.', '/specials'),
  ('events', 'Events', 'Shows, open houses, residencies and RSVPs.', '/events'),
  ('booking', 'Booking', 'Availability, booking requests and booking sources.', '/book'),
  ('shop', 'Shop', 'Products, variants, carts, orders and pickup.', '/shop'),
  ('reviews', 'Reviews', 'Verified reviews and owner responses.', '/reviews'),
  ('lead_forms', 'Lead forms', 'Contact, quote, valuation and inquiry forms.', '/contact'),
  ('gallery', 'Gallery', 'Public images, videos and embeds.', '/gallery'),
  ('sms_opt_in', 'SMS opt-in', 'Consent-aware SMS signup.', null),
  ('analytics', 'Analytics', 'Views, QR scans, clicks and conversion events.', null),
  ('live_session', 'Live session', 'QR rooms, voting, requests and live queues.', '/live'),
  ('tips', 'Tips', 'Stripe Connect tip payments and payout records.', '/tip'),
  ('content_wall', 'Content wall', 'Posts and membership-gated content.', '/community'),
  ('loyalty', 'Loyalty', 'Trip Pass points, rewards and redemptions.', '/rewards'),
  ('ai_media', 'AI media', 'Metered creative assets and campaign generation.', null),
  ('team', 'Team', 'Multiple profiles and organization-level management.', null)
on conflict (key) do update set name = excluded.name, description = excluded.description, public_route = excluded.public_route;
