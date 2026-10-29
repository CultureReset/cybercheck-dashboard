-- Module marketplace metadata is data, not a front-end business-type switch.
alter table profile_os.modules
  add column if not exists category text not null default 'operations',
  add column if not exists icon text not null default '◈',
  add column if not exists accent text not null default '#38bdf8',
  add column if not exists default_block_key text,
  add column if not exists manifest jsonb not null default '{}'::jsonb;

update profile_os.modules as m
set category = v.category, icon = v.icon, accent = v.accent, default_block_key = v.default_block_key
from (values
  ('quick_actions','growth','↗','#38bdf8','actions'),('catalog','commerce','▦','#a78bfa','catalog'),('menu','commerce','⌘','#f97316','menu'),('specials','growth','✦','#fb7185','specials'),('events','engagement','◷','#34d399','events'),('booking','operations','◫','#60a5fa','booking'),('shop','commerce','◒','#fbbf24','shop'),('reviews','growth','★','#f472b6','reviews'),('lead_forms','growth','✎','#38bdf8','form'),('gallery','content','▧','#c084fc','gallery'),('sms_opt_in','engagement','⌁','#2dd4bf','sms'),('analytics','operations','◱','#94a3b8','analytics'),('live_session','engagement','♫','#a78bfa','live'),('tips','commerce','♥','#4ade80','tips'),('content_wall','content','≡','#fb7185','posts'),('loyalty','engagement','◎','#fbbf24','loyalty'),('ai_media','content','✧','#818cf8','media'),('team','operations','◉','#38bdf8','team')
) as v(key, category, icon, accent, default_block_key)
where m.key = v.key;

-- Server-only public-page read model. Data is selected according to the installed
-- block's module key; profile.entity_kind is intentionally never consulted.
create or replace function public.cc_get_profile_payload(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = profile_os, public
as $$
  select jsonb_build_object(
    'profile', jsonb_build_object('id',p.id,'slug',p.slug,'display_name',p.display_name,'short_description',p.short_description,'logo_url',p.logo_url,'cover_url',p.cover_url,'theme',p.theme,'city',p.city,'region',p.region,'timezone',p.timezone),
    'actions', coalesce((select jsonb_agg(jsonb_build_object('label',a.label,'href',a.href,'action_type',a.action_type) order by a.sort_order) from profile_os.profile_actions a where a.profile_id=p.id and a.is_enabled),'[]'::jsonb),
    'blocks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',b.id,'module_key',b.module_key,'block_key',b.block_key,'title',b.title,'config',b.config,
        'data',jsonb_build_object(
          'entries',case when b.module_key in ('catalog','menu','specials','shop') then coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'title',e.title,'summary',e.summary,'price_from',e.price_from,'primary_image_url',e.primary_image_url,'metadata',e.metadata) order by e.sort_order,e.created_at desc) from profile_os.catalog_entries e where e.profile_id=p.id and e.is_public and e.status='active'),'[]'::jsonb) else '[]'::jsonb end,
          'products',case when b.module_key='shop' then coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'title',e.title,'summary',e.summary,'price_from',e.price_from,'primary_image_url',e.primary_image_url) order by e.sort_order,e.created_at desc) from profile_os.products pr join profile_os.catalog_entries e on e.id=pr.catalog_entry_id where pr.profile_id=p.id and pr.is_active and e.is_public),'[]'::jsonb) else '[]'::jsonb end,
          'events',case when b.module_key='events' then coalesce((select jsonb_agg(jsonb_build_object('id',ev.id,'title',ev.title,'description',ev.description,'event_kind',ev.event_kind,'starts_at',occ.starts_at) order by occ.starts_at nulls last,ev.created_at desc) from profile_os.events ev left join lateral (select starts_at from profile_os.event_occurrences where event_id=ev.id order by starts_at limit 1) occ on true where ev.profile_id=p.id and ev.is_public),'[]'::jsonb) else '[]'::jsonb end
        )
      ) order by b.sort_order)
      from profile_os.profile_blocks b where b.profile_id=p.id and b.is_visible
    ),'[]'::jsonb)
  ) from profile_os.profiles p where p.slug=p_slug and p.status='published' and p.is_public;
$$;

revoke all on function public.cc_get_profile_payload(text) from public, anon, authenticated;
grant execute on function public.cc_get_profile_payload(text) to service_role;
