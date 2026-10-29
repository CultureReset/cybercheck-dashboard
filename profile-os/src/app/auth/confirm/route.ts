import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { authDb } from "../../../lib/supabase-auth-server";
export async function GET(request: NextRequest) { const token_hash = request.nextUrl.searchParams.get("token_hash"); const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null; const target = new URL("/dashboard", request.url); if (token_hash && type) { const db = await authDb(); const { error } = await db.auth.verifyOtp({ token_hash, type }); if (!error) return NextResponse.redirect(target); } return NextResponse.redirect(new URL("/login", request.url)); }
