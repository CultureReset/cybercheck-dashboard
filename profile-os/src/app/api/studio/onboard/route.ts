import { NextResponse } from "next/server";
import { authenticatedUserId } from "../../../../lib/supabase-auth-server";
import { serverDb } from "../../../../lib/supabase-server";

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
export async function POST(request: Request) {
  const userId = await authenticatedUserId(); if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json(); const name = String(body.displayName ?? "").trim(); const slug = slugify(String(body.slug ?? name));
  if (name.length < 2 || slug.length < 2) return NextResponse.json({ error: "A name and URL slug are required." }, { status: 400 });
  const db = serverDb();
  const { data: org, error: orgError } = await db.schema("profile_os").from("organizations").insert({ name, slug: `${slug}-${userId.slice(0, 6)}` }).select("id").single();
  if (orgError || !org) return NextResponse.json({ error: "Could not create workspace." }, { status: 400 });
  await db.schema("profile_os").from("organization_members").insert({ organization_id: org.id, user_id: userId, role: "owner" });
  const { data: profile, error: profileError } = await db.schema("profile_os").from("profiles").insert({ organization_id: org.id, slug, display_name: name, short_description: String(body.description ?? "").trim() || null }).select("id").single();
  if (profileError || !profile) return NextResponse.json({ error: "Workspace created, but profile creation failed." }, { status: 400 });
  return NextResponse.json({ profileId: profile.id }, { status: 201 });
}
