import { NextResponse } from "next/server";
import { authenticatedUserId } from "../../../../../../lib/supabase-auth-server";
import { installModule } from "../../../../../../lib/studio";

export async function POST(request: Request, { params }: { params: Promise<{ profileId: string }> }) {
  const userId = await authenticatedUserId(); if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { profileId } = await params; const body = await request.json(); const moduleKey = String(body.moduleKey ?? "");
  if (!moduleKey) return NextResponse.json({ error: "Unknown app" }, { status: 400 });
  try { await installModule(userId, profileId, moduleKey, Boolean(body.enable)); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "Not allowed" }, { status: 403 }); }
}
