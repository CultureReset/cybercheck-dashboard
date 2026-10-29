import { NextResponse, type NextRequest } from "next/server";
import { serverDb } from "../../../../../lib/supabase-server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const href = request.nextUrl.searchParams.get("href");
  const label = request.nextUrl.searchParams.get("label")?.slice(0, 100) ?? "action";
  if (!href) return NextResponse.redirect(new URL(`/${slug}`, request.url));

  const db = serverDb();
  const { data: profile } = await db.schema("profile_os").from("profiles").select("id,organization_id").eq("slug", slug).eq("status", "published").eq("is_public", true).maybeSingle();
  if (profile) {
    void db.schema("profile_os").from("analytics_events").insert({
      organization_id: profile.organization_id,
      profile_id: profile.id,
      event_name: "action_clicked",
      module_key: "quick_actions",
      properties: { label }
    });
  }

  // Allow absolute (http/https/tel/mailto) or relative paths
  if (/^(https?:|tel:|mailto:)/.test(href)) {
    return NextResponse.redirect(href);
  }
  if (href.startsWith("/")) {
    return NextResponse.redirect(new URL(href, request.url));
  }
  return NextResponse.redirect(new URL(`/${slug}`, request.url));
}
