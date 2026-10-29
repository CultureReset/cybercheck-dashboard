import { NextResponse, type NextRequest } from "next/server";
import { authDb } from "../../../lib/supabase-auth-server";
export async function POST(request: NextRequest) { const db = await authDb(); await db.auth.signOut(); return NextResponse.redirect(new URL("/login", request.url), { status: 302 }); }
