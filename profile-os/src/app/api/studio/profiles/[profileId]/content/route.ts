import { NextResponse } from "next/server";
import { authenticatedUserId } from "../../../../../../lib/supabase-auth-server";
import { memberForProfile } from "../../../../../../lib/studio";
import { serverDb } from "../../../../../../lib/supabase-server";

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70);
export async function GET(request: Request, { params }: { params: Promise<{ profileId: string }> }) {
  const userId = await authenticatedUserId(); if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { profileId } = await params; if (!await memberForProfile(userId, profileId)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const kind = new URL(request.url).searchParams.get("kind"); const db = serverDb();
  if (kind === "events") { const { data } = await db.schema("profile_os").from("events").select("id,title,description,event_kind,is_public,created_at").eq("profile_id", profileId).order("created_at", { ascending: false }); return NextResponse.json({ items: data ?? [] }); }
  const typeMap: Record<string, string> = { menu: "menu_item", shop: "product", catalog: "service", listings: "listing", songs: "song" };
  const entryType = typeMap[kind ?? "catalog"] ?? "service"; const { data } = await db.schema("profile_os").from("catalog_entries").select("id,title,summary,price_from,primary_image_url,status,is_public,entry_type,created_at").eq("profile_id", profileId).eq("entry_type", entryType).order("sort_order"); return NextResponse.json({ items: data ?? [] });
}
export async function POST(request: Request, { params }: { params: Promise<{ profileId: string }> }) {
  const userId = await authenticatedUserId(); if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { profileId } = await params; const member = await memberForProfile(userId, profileId); if (!member) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const body = await request.json(); const kind = String(body.kind ?? "catalog"); const title = String(body.title ?? "").trim(); if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 }); const db = serverDb();
  if (kind === "events") { const { data, error } = await db.schema("profile_os").from("events").insert({ organization_id: member.organization_id, profile_id: profileId, title, description: String(body.summary ?? "") || null, event_kind: String(body.eventKind ?? "event") }).select("id").single(); if (error) return NextResponse.json({ error: "Could not create event" }, { status: 400 }); return NextResponse.json({ id: data.id }, { status: 201 }); }
  const typeMap: Record<string, string> = { menu: "menu_item", shop: "product", catalog: "service", listings: "listing", songs: "song" }; const entryType = typeMap[kind] ?? "service"; const { data: entry, error } = await db.schema("profile_os").from("catalog_entries").insert({ organization_id: member.organization_id, profile_id: profileId, entry_type: entryType, title, slug: `${slugify(title)}-${crypto.randomUUID().slice(0, 6)}`, summary: String(body.summary ?? "") || null, price_from: body.price === "" || body.price == null ? null : Number(body.price), primary_image_url: String(body.imageUrl ?? "") || null }).select("id").single(); if (error || !entry) return NextResponse.json({ error: "Could not create item" }, { status: 400 });
  if (kind === "menu") await db.schema("profile_os").from("menu_items").insert({ organization_id: member.organization_id, profile_id: profileId, catalog_entry_id: entry.id });
  if (kind === "shop") await db.schema("profile_os").from("products").insert({ organization_id: member.organization_id, profile_id: profileId, catalog_entry_id: entry.id, fulfillment_mode: String(body.fulfillment ?? "shipping") });
  return NextResponse.json({ id: entry.id }, { status: 201 });
}
export async function DELETE(request: Request, { params }: { params: Promise<{ profileId: string }> }) {
  const userId = await authenticatedUserId(); if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { profileId } = await params; if (!await memberForProfile(userId, profileId)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const body = await request.json(); const id = String(body.id ?? ""); const kind = String(body.kind ?? "catalog"); if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const db = serverDb();
  if (kind === "events") {
    const { error } = await db.schema("profile_os").from("events").delete().eq("id", id).eq("profile_id", profileId);
    if (error) return NextResponse.json({ error: "Could not delete" }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  const { error } = await db.schema("profile_os").from("catalog_entries").delete().eq("id", id).eq("profile_id", profileId);
  if (error) return NextResponse.json({ error: "Could not delete" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
