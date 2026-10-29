-- The private profile_os schema stays out of Supabase's browser-facing Data API.
-- Next.js server routes call this narrowly scoped function with the service role.
create or replace function public.cc_get_profile_payload(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = profile_os, public
as $$
  select jsonb_build_object(
    'profile', jsonb_build_object(
      'id', p.id,
      'slug', p.slug,
      'display_name', p.display_name,
      'short_description', p.short_description,
      'logo_url', p.logo_url,
      'cover_url', p.cover_url,
      'theme', p.theme,
      'city', p.city,
      'region', p.region,
      'timezone', p.timezone
    ),
    'actions', coalesce((
      select jsonb_agg(jsonb_build_object('label', a.label, 'href', a.href, 'action_type', a.action_type) order by a.sort_order)
      from profile_os.profile_actions a
      where a.profile_id = p.id and a.is_enabled
    ), '[]'::jsonb),
    'blocks', coalesce((
      select jsonb_agg(jsonb_build_object('id', b.id, 'module_key', b.module_key, 'block_key', b.block_key, 'title', b.title, 'config', b.config) order by b.sort_order)
      from profile_os.profile_blocks b
      where b.profile_id = p.id and b.is_visible
    ), '[]'::jsonb)
  )
  from profile_os.profiles p
  where p.slug = p_slug and p.status = 'published' and p.is_public;
$$;

revoke all on function public.cc_get_profile_payload(text) from public, anon, authenticated;
grant execute on function public.cc_get_profile_payload(text) to service_role;
