import { NextResponse } from "next/server";
import { serverDb } from "../../../../../lib/supabase-server";

const clean = (value: unknown, limit = 500) => typeof value === "string" ? value.trim().slice(0, limit) : "";
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const body = await request.json(); const name = clean(body.name, 120); const contact = clean(body.contact, 200); const message = clean(body.message, 2000); const blockKey = clean(body.blockKey, 80);
  if (!name || !contact) return NextResponse.json({ error: "Name and email or phone are required." }, { status: 400 });
  const db = serverDb(); const { data: profile } = await db.schema("profile_os").from("profiles").select("id,organization_id,slug").eq("slug", slug).eq("status", "published").eq("is_public", true).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profile unavailable" }, { status: 404 });
  const payload = { name, contact, message, block_key: blockKey };
  await Promise.all([
    db.schema("profile_os").from("leads").insert({ organization_id: profile.organization_id, profile_id: profile.id, source: "public_profile", payload }),
    db.schema("profile_os").from("analytics_events").insert({ organization_id: profile.organization_id, profile_id: profile.id, event_name: "lead_submitted", block_key: blockKey || null, module_key: "lead_forms", properties: { source: "public_profile" } })
  ]);
  const hook = process.env.N8N_PROFILE_LEAD_WEBHOOK_URL;
  if (hook) fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event: "profile.lead_created", profile: { id: profile.id, slug }, lead: payload }) }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
