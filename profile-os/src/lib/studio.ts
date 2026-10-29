import { serverDb } from "./supabase-server";

type Member = { organization_id: string; role: string };
export const WRITE_ROLES = new Set(["owner", "admin", "editor"]);
export const canWriteRole = (role: string | null | undefined) => WRITE_ROLES.has(String(role ?? ""));

export async function memberForProfile(userId: string, profileId: string) {
  const db = serverDb();
  const { data: profile } = await db.schema("profile_os").from("profiles").select("id, organization_id").eq("id", profileId).maybeSingle();
  if (!profile) return null;
  const { data: member } = await db.schema("profile_os").from("organization_members").select("organization_id, role").eq("organization_id", profile.organization_id).eq("user_id", userId).maybeSingle<Member>();
  return member ? { ...member, profile } : null;
}

export async function requireWriteAccess(userId: string, profileId: string) {
  const member = await memberForProfile(userId, profileId);
  if (!member) throw new Error("Not allowed");
  if (!canWriteRole(member.role)) throw new Error("Read only");
  return member;
}

export async function studioPayload(userId: string) {
  const db = serverDb();
  const { data: memberships } = await db.schema("profile_os").from("organization_members").select("organization_id, role").eq("user_id", userId);
  const orgIds = (memberships ?? []).map((member: Member) => member.organization_id);
  const roleByOrg = Object.fromEntries((memberships ?? []).map((m: Member) => [m.organization_id, m.role]));
  const { data: catalog } = await db.schema("profile_os").from("modules").select("key,name,description,category,icon,accent,default_block_key,manifest,installation_mode,publisher_organization_id").eq("is_active", true).or(`installation_mode.eq.platform,publisher_organization_id.in.(${orgIds.join(",") || "00000000-0000-0000-0000-000000000000"})`);
  const modules = (catalog ?? []).map((app) => ({ key: app.key, name: app.name, description: app.description, category: app.category, icon: app.icon, accent: app.accent, defaultBlock: app.default_block_key ?? "block", manifest: app.manifest }));
  if (!orgIds.length) return { profiles: [], modules };
  const { data: profiles } = await db.schema("profile_os").from("profiles").select("id, slug, display_name, short_description, status, is_public, organization_id, theme, recommendation_goals").in("organization_id", orgIds).order("created_at");
  const ids = (profiles ?? []).map((profile) => profile.id);
  const [{ data: installed }, { data: blocks }] = await Promise.all([
    ids.length ? db.schema("profile_os").from("profile_modules").select("profile_id,module_key,config,is_enabled").in("profile_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? db.schema("profile_os").from("profile_blocks").select("id,profile_id,module_key,block_key,title,config,sort_order,is_visible").in("profile_id", ids).order("sort_order") : Promise.resolve({ data: [] })
  ]);
  return {
    profiles: (profiles ?? []).map((profile) => ({
      ...profile,
      role: roleByOrg[profile.organization_id] ?? "viewer",
      canWrite: canWriteRole(roleByOrg[profile.organization_id]),
      installed: (installed ?? []).filter((item) => item.profile_id === profile.id),
      blocks: (blocks ?? []).filter((item) => item.profile_id === profile.id)
    })),
    modules
  };
}

export async function installModule(userId: string, profileId: string, moduleKey: string, enable: boolean) {
  const member = await requireWriteAccess(userId, profileId);
  const db = serverDb();
  const { data: app } = await db.schema("profile_os").from("modules").select("key,name,default_block_key,manifest,installation_mode,publisher_organization_id").eq("key", moduleKey).eq("is_active", true).maybeSingle();
  if (!app || (app.installation_mode !== "platform" && app.publisher_organization_id !== member.organization_id)) throw new Error("Unknown module");
  if (!enable) {
    await db.schema("profile_os").from("profile_modules").update({ is_enabled: false }).eq("profile_id", profileId).eq("module_key", moduleKey);
    await db.schema("profile_os").from("profile_blocks").update({ is_visible: false }).eq("profile_id", profileId).eq("module_key", moduleKey);
    return;
  }
  await db.schema("profile_os").from("profile_modules").upsert({ profile_id: profileId, organization_id: member.organization_id, module_key: moduleKey, is_enabled: true }, { onConflict: "profile_id,module_key" });
  const { data: existing } = await db.schema("profile_os").from("profile_blocks").select("id").eq("profile_id", profileId).eq("module_key", moduleKey).limit(1);
  if (existing?.length) { await db.schema("profile_os").from("profile_blocks").update({ is_visible: true }).eq("profile_id", profileId).eq("module_key", moduleKey); return; }
  const { data: last } = await db.schema("profile_os").from("profile_blocks").select("sort_order").eq("profile_id", profileId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  await db.schema("profile_os").from("profile_blocks").insert({ organization_id: member.organization_id, profile_id: profileId, module_key: moduleKey, block_key: app.default_block_key ?? "block", title: app.name, config: { component: (app.manifest as { component?: string } | null)?.component }, sort_order: (last?.sort_order ?? 0) + 10 });
}
