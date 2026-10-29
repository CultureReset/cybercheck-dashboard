import { NextResponse } from "next/server";
import { getPublishedProfile } from "../../../../lib/profile";
import { clientIp, rateLimit } from "../../../../lib/rate-limit";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const limited = rateLimit(`public-get:${clientIp(request)}`, 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } });
  }
  const { slug } = await params;
  const profile = await getPublishedProfile(slug);
  return profile ? NextResponse.json(profile) : NextResponse.json({ error: "Profile not found" }, { status: 404 });
}
