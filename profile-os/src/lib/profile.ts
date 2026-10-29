import { serverDb } from "./supabase-server";

export async function getPublishedProfile(slug: string) {
  const db = serverDb();
  const { data, error } = await db.rpc("cc_get_profile_payload", { p_slug: slug });
  if (error || !data) return null;
  return data as {
    profile: { display_name: string; short_description: string | null; cover_url: string | null; logo_url: string | null; theme: Record<string, string> | null; city: string | null; region: string | null };
    blocks: Array<{ id: string; module_key: string; block_key: string; title: string | null; config: Record<string, unknown> | null }>;
    actions: Array<{ label: string; href: string; action_type: string }>;
  };
}
