-- Seed profiles prove that the same block engine supports restaurant, artist, and realtor hybrids.
with created_org as (
  insert into profile_os.organizations (name, slug)
  values ('CyberCheck Profile OS Demo', 'cybercheck-profile-os-demo')
  returning id
), created_profiles as (
  insert into profile_os.profiles (
    organization_id, slug, entity_kind, display_name, short_description, city, region,
    theme, status, is_public, published_at
  )
  select id, slug, entity_kind, display_name, short_description, 'Orange Beach', 'AL', theme, 'published', true, now()
  from created_org cross join (values
    ('tide-table-demo', 'restaurant', 'Tide Table Demo', 'Fresh Gulf seafood, happy hour, live music, and coastal merch.', '{"accent":"#0f766e"}'::jsonb),
    ('wave-room-demo', 'artist', 'Wave Room Demo', 'Live music, fan requests, show dates, and merchandise.', '{"accent":"#7c3aed"}'::jsonb),
    ('coast-key-demo', 'realtor', 'Coast Key Demo', 'Local property guidance, open houses, and neighborhood guides.', '{"accent":"#1d4ed8"}'::jsonb)
  ) as demo(slug, entity_kind, display_name, short_description, theme)
  returning id, organization_id, slug
)
insert into profile_os.profile_modules (profile_id, organization_id, module_key)
select p.id, p.organization_id, module_key
from created_profiles p
cross join lateral unnest(case p.slug
  when 'tide-table-demo' then array['quick_actions','menu','specials','events','shop','reviews','sms_opt_in','analytics']
  when 'wave-room-demo' then array['quick_actions','catalog','events','shop','live_session','tips','content_wall','analytics']
  else array['quick_actions','catalog','events','lead_forms','gallery','analytics']
end) as module_key;

insert into profile_os.profile_blocks (organization_id, profile_id, module_key, block_key, title, sort_order)
select p.organization_id, p.id, block.module_key, block.block_key, block.title, block.sort_order
from profile_os.profiles p
join profile_os.organizations o on o.id = p.organization_id and o.slug = 'cybercheck-profile-os-demo'
cross join lateral (values
  ('tide-table-demo', 'menu', 'menu', 'Menu', 10),
  ('tide-table-demo', 'specials', 'happy-hour', 'Happy hour', 20),
  ('tide-table-demo', 'events', 'events', 'Live music & events', 30),
  ('tide-table-demo', 'shop', 'shop', 'Coastal goods', 40),
  ('wave-room-demo', 'live_session', 'live', 'Tonight''s live set', 10),
  ('wave-room-demo', 'events', 'shows', 'Upcoming shows', 20),
  ('wave-room-demo', 'shop', 'merch', 'Merch', 30),
  ('coast-key-demo', 'catalog', 'listings', 'Featured listings', 10),
  ('coast-key-demo', 'events', 'open-houses', 'Open houses', 20),
  ('coast-key-demo', 'lead_forms', 'valuation', 'Request a valuation', 30)
) as block(profile_slug, module_key, block_key, title, sort_order)
where p.slug = block.profile_slug;

insert into profile_os.profile_actions (organization_id, profile_id, label, action_type, href, sort_order)
select p.organization_id, p.id, a.label, a.action_type, a.href, a.sort_order
from profile_os.profiles p
join profile_os.organizations o on o.id = p.organization_id and o.slug = 'cybercheck-profile-os-demo'
cross join lateral (values
  ('tide-table-demo', 'Call', 'call', 'tel:+12515550100', 10),
  ('tide-table-demo', 'Directions', 'directions', 'https://maps.google.com', 20),
  ('tide-table-demo', 'Reserve', 'booking', '/tide-table-demo/book', 30),
  ('wave-room-demo', 'Tip', 'tip', '/wave-room-demo/tip', 10),
  ('wave-room-demo', 'Request a song', 'live', '/wave-room-demo/live', 20),
  ('wave-room-demo', 'Book', 'booking', '/wave-room-demo/book', 30),
  ('coast-key-demo', 'Call', 'call', 'tel:+12515550101', 10),
  ('coast-key-demo', 'Get valuation', 'form', '/coast-key-demo/contact', 20),
  ('coast-key-demo', 'Save contact', 'vcard', '/coast-key-demo/contact.vcf', 30)
) as a(profile_slug, label, action_type, href, sort_order)
where p.slug = a.profile_slug;

insert into profile_os.catalog_categories (organization_id, profile_id, name, slug, sort_order)
select p.organization_id, p.id, c.name, c.slug, c.sort_order
from profile_os.profiles p
join profile_os.organizations o on o.id = p.organization_id and o.slug = 'cybercheck-profile-os-demo'
cross join lateral (values
  ('tide-table-demo', 'Lunch', 'lunch', 10),
  ('wave-room-demo', 'Fan favorites', 'fan-favorites', 10),
  ('coast-key-demo', 'Featured homes', 'featured-homes', 10)
) as c(profile_slug, name, slug, sort_order)
where p.slug = c.profile_slug;

insert into profile_os.catalog_entries (organization_id, profile_id, category_id, entry_type, title, slug, summary, price_from)
select p.organization_id, p.id, c.id, d.entry_type::profile_os.entry_type, d.title, d.slug, d.summary, d.price_from
from profile_os.profiles p
join profile_os.organizations o on o.id = p.organization_id and o.slug = 'cybercheck-profile-os-demo'
join profile_os.catalog_categories c on c.profile_id = p.id
cross join lateral (values
  ('tide-table-demo', 'lunch', 'menu_item', 'Blackened Gulf Shrimp', 'blackened-gulf-shrimp', 'Lunch plate with seasoned fries.', 15.99),
  ('wave-room-demo', 'fan-favorites', 'song', 'Coastal Highway', 'coastal-highway', 'Fan-request favorite.', null),
  ('coast-key-demo', 'featured-homes', 'property', 'Bayfront Retreat', 'bayfront-retreat', 'Three-bedroom waterfront home.', 749000.00)
) as d(profile_slug, category_slug, entry_type, title, slug, summary, price_from)
where p.slug = d.profile_slug and c.slug = d.category_slug;

insert into profile_os.events (organization_id, profile_id, title, description, event_kind)
select p.organization_id, p.id, d.title, d.description, d.event_kind
from profile_os.profiles p
join profile_os.organizations o on o.id = p.organization_id and o.slug = 'cybercheck-profile-os-demo'
cross join lateral (values
  ('tide-table-demo', 'Sunset Sessions', 'Live acoustic music every Friday.', 'live_music'),
  ('wave-room-demo', 'Wave Room at the Wharf', 'Fan voting opens one hour before the show.', 'show'),
  ('coast-key-demo', 'Bayfront Open House', 'Walk-through and neighborhood tour.', 'open_house')
) as d(profile_slug, title, description, event_kind)
where p.slug = d.profile_slug;
