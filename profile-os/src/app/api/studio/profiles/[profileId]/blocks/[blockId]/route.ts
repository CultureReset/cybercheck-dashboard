import { NextResponse } from "next/server";
import { authenticatedUserId } from "../../../../../../../lib/supabase-auth-server";
import { requireWriteAccess } from "../../../../../../../lib/studio";
import { serverDb } from "../../../../../../../lib/supabase-server";

export async function PATCH(request: Request, { params }: { params: Promise<{ profileId: string; blockId: string }> }) {
  const userId = await authenticatedUserId(); if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { profileId, blockId } = await params;
  try { await requireWriteAccess(userId, profileId); } catch { return NextResponse.json({ error: "Not allowed" }, { status: 403 }); }
  const body = await request.json(); const update: Record<string, unknown> = {};
  if (typeof body.title === "string") update.title = body.title.slice(0, 100);
  if (typeof body.is_visible === "boolean") update.is_visible = body.is_visible;
  if (body.config && typeof body.config === "object" && !Array.isArray(body.config)) update.config = body.config;
  await serverDb().schema("profile_os").from("profile_blocks").update(update).eq("id", blockId).eq("profile_id", profileId);
  return NextResponse.json({ ok: true });
}
