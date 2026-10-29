import { NextResponse } from "next/server";
import { authenticatedUserId } from "../../../../../lib/supabase-auth-server";
import { requireWriteAccess } from "../../../../../lib/studio";
import { serverDb } from "../../../../../lib/supabase-server";

export async function PATCH(request: Request, { params }: { params: Promise<{ profileId: string }> }) {
  const userId = await authenticatedUserId(); if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { profileId } = await params;
  try { await requireWriteAccess(userId, profileId); } catch { return NextResponse.json({ error: "Not allowed" }, { status: 403 }); }
  const body = await request.json(); const goals = Array.isArray(body.recommendation_goals) ? body.recommendation_goals.filter((goal: unknown): goal is string => typeof goal === "string").slice(0, 20) : null;
  if (!goals) return NextResponse.json({ error: "Invalid goals" }, { status: 400 });
  await serverDb().schema("profile_os").from("profiles").update({ recommendation_goals: goals }).eq("id", profileId);
  return NextResponse.json({ ok: true });
}
