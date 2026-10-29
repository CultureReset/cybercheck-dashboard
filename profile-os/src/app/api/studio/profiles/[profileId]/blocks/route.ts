import { NextResponse } from "next/server";
import { authenticatedUserId } from "../../../../../../lib/supabase-auth-server";
import { memberForProfile } from "../../../../../../lib/studio";
import { serverDb } from "../../../../../../lib/supabase-server";
import { moduleRegistry, MODULE_KEYS, type ModuleKey } from "../../../../../../lib/modules";

export async function POST(request: Request, { params }: { params: Promise<{ profileId: string }> }) {
  const userId = await authenticatedUserId(); if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { profileId } = await params; const member = await memberForProfile(userId, profileId); if (!member) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const body = await request.json(); const moduleKey = String(body.moduleKey) as ModuleKey; if (!MODULE_KEYS.includes(moduleKey)) return NextResponse.json({ error: "Unknown app" }, { status: 400 });
  const db = serverDb(); const { data: enabled } = await db.schema("profile_os").from("profile_modules").select("module_key").eq("profile_id", profileId).eq("module_key", moduleKey).eq("is_enabled", true).maybeSingle();
  if (!enabled) return NextResponse.json({ error: "Install this app before adding its blocks." }, { status: 400 });
  const { data: last } = await db.schema("profile_os").from("profile_blocks").select("sort_order").eq("profile_id", profileId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const definition = moduleRegistry[moduleKey]; const blockKey = `${definition.defaultBlock}-${crypto.randomUUID().slice(0, 8)}`;
  await db.schema("profile_os").from("profile_blocks").insert({ organization_id: member.organization_id, profile_id: profileId, module_key: moduleKey, block_key: blockKey, title: definition.name, sort_order: (last?.sort_order ?? 0) + 10 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ profileId: string }> }) {
  const userId = await authenticatedUserId(); if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { profileId } = await params; if (!await memberForProfile(userId, profileId)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const body = await request.json(); const blocks: Array<{ id: string; is_visible: boolean }> = Array.isArray(body.blocks) ? body.blocks : [];
  const ids = blocks.map((block: { id: string }) => String(block.id)); if (!ids.length) return NextResponse.json({ ok: true });
  const db = serverDb(); const { data: owned } = await db.schema("profile_os").from("profile_blocks").select("id").eq("profile_id", profileId).in("id", ids);
  if ((owned?.length ?? 0) !== ids.length) return NextResponse.json({ error: "Invalid block stack" }, { status: 400 });
  await Promise.all(blocks.map((block: { id: string; is_visible: boolean }, index: number) => db.schema("profile_os").from("profile_blocks").update({ sort_order: (index + 1) * 10, is_visible: Boolean(block.is_visible) }).eq("id", block.id).eq("profile_id", profileId)));
  return NextResponse.json({ ok: true });
}
