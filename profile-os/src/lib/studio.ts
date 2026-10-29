import { serverDb } from "./supabase-server";
import { moduleRegistry, type ModuleKey } from "./modules";

type Member = { organization_id: string; role: string };
export async function memberForProfile(userId: string, profileId: string) {
  const db = serverDb();
  const { data: profile } = await db.schema("profile_os").from("profiles").select("id, organization_id").eq("id", profileId).maybeSingle();
  if (!profile) return null;
  const { data: member } = await db.schema("profile_os").from("organization_members").select("organization_id, role").eq("organization_id", profile.organization_id).eq("user_id", userId).maybeSingle<Member>();
  return member ? { ...member, profile } : null;
}

export async function studioPayload(userId: string) {
  const db = serverDb();
  const { data: memberships } = await db.schema("profile_os").from("organization_members").select("organization_id, role").eq("user_id", userId);
  const orgIds = (memberships ?? []).map((member: Member) => member.organization_id);
  if (!orgIds.length) return { profiles: [], modules: Object.values(moduleRegistry) };
  const { data: profiles } = await db.schema("profile_os").from("profiles").select("id, slug, display_name, short_description, status, is_public, organization_id, theme, recommendation_goals").in("organization_id", orgIds).order("created_at");
  const ids = (profiles ?? []).map((profile) => profile.id);
  const [{ data: installed }, { data: blocks }] = await Promise.all([
    ids.length ? db.schema("profile_os").from("profile_modules").select("profile_id,module_key,config,is_enabled").in("profile_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? db.schema("profile_os").from("profile_blocks").select("id,profile_id,module_key,block_key,title,config,sort_order,is_visible").in("profile_id", ids).order("sort_order") : Promise.resolve({ data: [] })
  ]);
  return { profiles: (profiles ?? []).map((profile) => ({ ...profile, installed: (installed ?? []).filter((item) => item.profile_id === profile.id), blocks: (blocks ?? []).filter((item) => item.profile_id === profile.id) })), modules: Object.values(moduleRegistry) };
}

export async function installModule(userId: string, profileId: string, moduleKey: ModuleKey, enable: boolean) {
  const member = await memberForProfile(userId, profileId); if (!member) throw new Error("Not allowed");
  const db = serverDb(); const registry = moduleRegistry[moduleKey]; if (!registry) throw new Error("Unknown module");
  if (!enable) {
    await db.schema("profile_os").from("profile_modules").update({ is_enabled: false }).eq("profile_id", profileId).eq("module_key", moduleKey);
    await db.schema("profile_os").from("profile_blocks").update({ is_visible: false }).eq("profile_id", profileId).eq("module_key", moduleKey);
    return;
  }
  await db.schema("profile_os").from("profile_modules").upsert({ profile_id: profileId, organization_id: member.organization_id, module_key: moduleKey, is_enabled: true }, { onConflict: "profile_id,module_key" });
  const { data: existing } = await db.schema("profile_os").from("profile_blocks").select("id").eq("profile_id", profileId).eq("module_key", moduleKey).limit(1);
  if (existing?.length) { await db.schema("profile_os").from("profile_blocks").update({ is_visible: true }).eq("profile_id", profileId).eq("module_key", moduleKey); return; }
  const { data: last } = await db.schema("profile_os").from("profile_blocks").select("sort_order").eq("profile_id", profileId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  await db.schema("profile_os").from("profile_blocks").insert({ organization_id: member.organization_id, profile_id: profileId, module_key: moduleKey, block_key: registry.defaultBlock, title: registry.name, sort_order: (last?.sort_order ?? 0) + 10 });
}
