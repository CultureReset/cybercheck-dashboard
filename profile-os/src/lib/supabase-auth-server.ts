import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function authDb() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (cookiesToSet) => {
        try { cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* proxy persists refreshed cookies */ }
      }
    }
  });
}

export async function authenticatedUserId() {
  const client = await authDb();
  const { data, error } = await client.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
}
