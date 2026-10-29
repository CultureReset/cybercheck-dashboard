-- Recommendation inputs describe what a profile wants to accomplish. They do
-- not restrict modules and never depend on the profile's industry/entity_kind.
alter table profile_os.profiles
  add column if not exists recommendation_goals jsonb not null default '[]'::jsonb;
