-- Split org RLS: every member can SELECT; writes require owner/admin/editor.
-- member_role enum: owner, admin, manager, editor, staff, viewer

create or replace function profile_os.can_write_org(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = profile_os, public
as $$
  select auth.uid() is not null and exists (
    select 1 from profile_os.organization_members m
    where m.organization_id = target_organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'editor')
  );
$$;
revoke all on function profile_os.can_write_org(uuid) from public;
grant execute on function profile_os.can_write_org(uuid) to authenticated;

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
    execute format('drop policy if exists member_access on profile_os.%I', table_name);
    execute format('drop policy if exists member_select on profile_os.%I', table_name);
    execute format('drop policy if exists member_write on profile_os.%I', table_name);
    execute format('drop policy if exists member_update on profile_os.%I', table_name);
    execute format('drop policy if exists member_delete on profile_os.%I', table_name);
    execute format(
      'create policy member_select on profile_os.%I for select to authenticated using (profile_os.is_org_member(organization_id))',
      table_name
    );
    execute format(
      'create policy member_insert on profile_os.%I for insert to authenticated with check (profile_os.can_write_org(organization_id))',
      table_name
    );
    execute format(
      'create policy member_update on profile_os.%I for update to authenticated using (profile_os.can_write_org(organization_id)) with check (profile_os.can_write_org(organization_id))',
      table_name
    );
    execute format(
      'create policy member_delete on profile_os.%I for delete to authenticated using (profile_os.can_write_org(organization_id))',
      table_name
    );
  end loop;
end $$;

-- module_versions has no organization_id; gate via publisher org on modules
alter table profile_os.module_versions enable row level security;
drop policy if exists "owners can read their app versions" on profile_os.module_versions;
drop policy if exists member_select on profile_os.module_versions;
drop policy if exists member_write on profile_os.module_versions;
drop policy if exists member_access on profile_os.module_versions;
create policy member_select on profile_os.module_versions for select to authenticated
using (
  exists (
    select 1 from profile_os.modules m
    where m.key = module_versions.module_key and m.installation_mode = 'platform'
  )
  or exists (
    select 1 from profile_os.modules m
    join profile_os.organization_members om on om.organization_id = m.publisher_organization_id
    where m.key = module_versions.module_key and om.user_id = auth.uid()
  )
);
create policy member_write on profile_os.module_versions for all to authenticated
using (
  exists (
    select 1 from profile_os.modules m
    join profile_os.organization_members om on om.organization_id = m.publisher_organization_id
    where m.key = module_versions.module_key and om.user_id = auth.uid()
      and om.role in ('owner', 'admin', 'editor')
  )
)
with check (
  exists (
    select 1 from profile_os.modules m
    join profile_os.organization_members om on om.organization_id = m.publisher_organization_id
    where m.key = module_versions.module_key and om.user_id = auth.uid()
      and om.role in ('owner', 'admin', 'editor')
  )
);

-- Organizations: members can read; writers can update; anyone authenticated may create a new org (onboard)
drop policy if exists organization_member_insert on profile_os.organizations;
drop policy if exists organization_member_update on profile_os.organizations;
drop policy if exists organization_member_write on profile_os.organizations;
create policy organization_insert on profile_os.organizations for insert to authenticated with check (true);
create policy organization_update on profile_os.organizations for update to authenticated using (profile_os.can_write_org(id)) with check (profile_os.can_write_org(id));

drop policy if exists organization_member_insert on profile_os.organization_members;
drop policy if exists organization_member_update on profile_os.organization_members;
drop policy if exists organization_member_delete on profile_os.organization_members;
drop policy if exists organization_member_mutate on profile_os.organization_members;
create policy organization_members_insert on profile_os.organization_members for insert to authenticated with check (
  profile_os.can_write_org(organization_id)
  or not exists (select 1 from profile_os.organization_members m where m.organization_id = organization_id)
);
create policy organization_members_update on profile_os.organization_members for update to authenticated using (profile_os.can_write_org(organization_id)) with check (profile_os.can_write_org(organization_id));
create policy organization_members_delete on profile_os.organization_members for delete to authenticated using (profile_os.can_write_org(organization_id));

drop policy if exists module_registry_insert on profile_os.modules;
drop policy if exists module_registry_update on profile_os.modules;
drop policy if exists module_registry_write on profile_os.modules;
create policy module_registry_insert on profile_os.modules for insert to authenticated with check (
  publisher_organization_id is not null and profile_os.can_write_org(publisher_organization_id)
);
create policy module_registry_update on profile_os.modules for update to authenticated
  using (publisher_organization_id is not null and profile_os.can_write_org(publisher_organization_id))
  with check (publisher_organization_id is not null and profile_os.can_write_org(publisher_organization_id));
