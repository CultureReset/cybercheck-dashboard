import { NextResponse } from "next/server";
import { authenticatedUserId } from "../../../lib/supabase-auth-server";
import { studioPayload } from "../../../lib/studio";

export async function GET() {
  const userId = await authenticatedUserId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  return NextResponse.json(await studioPayload(userId));
}
