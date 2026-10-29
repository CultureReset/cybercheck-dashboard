-- The App Store is a versioned manifest catalog. Apps may select only reviewed
-- component capabilities; uploaded arbitrary JavaScript is never executed.
alter table profile_os.modules
  add column if not exists publisher_organization_id uuid references profile_os.organizations(id),
  add column if not exists installation_mode text not null default 'platform',
  add column if not exists preview_url text,
  add column if not exists is_listed boolean not null default true;

create table if not exists profile_os.module_versions (
  id uuid primary key default gen_random_uuid(),
  module_key text not null references profile_os.modules(key) on delete cascade,
  version text not null,
  manifest jsonb not null,
  release_notes text,
  created_by uuid references auth.users(id),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (module_key, version)
);
alter table profile_os.module_versions enable row level security;

create policy "owners can read their app versions" on profile_os.module_versions for select to authenticated
using (exists (select 1 from profile_os.modules m join profile_os.organization_members om on om.organization_id=m.publisher_organization_id where m.key=module_versions.module_key and om.user_id=(select auth.uid())));
