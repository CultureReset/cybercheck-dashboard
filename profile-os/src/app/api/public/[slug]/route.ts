import { NextResponse } from "next/server";
import { getPublishedProfile } from "../../../../lib/profile";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getPublishedProfile(slug);
  return profile ? NextResponse.json(profile) : NextResponse.json({ error: "Profile not found" }, { status: 404 });
}
