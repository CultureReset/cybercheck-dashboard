type Props = {
  profile: { display_name: string; short_description: string | null; cover_url: string | null; logo_url: string | null; theme: Record<string, string> | null; city: string | null; region: string | null };
  actions: Array<{ label: string; href: string; action_type: string }>;
  blocks: Array<{ id: string; module_key: string; block_key: string; title: string | null; config: Record<string, unknown> | null }>;
};

export function ProfileRenderer({ profile, actions, blocks }: Props) {
  const accent = profile.theme?.accent ?? "#10b981";
  return <main style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px", fontFamily: "Arial, sans-serif" }}>
    {profile.cover_url && <img src={profile.cover_url} alt="" style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 18 }} />}
    <header style={{ textAlign: "center", margin: "24px 0" }}>
      {profile.logo_url && <img src={profile.logo_url} alt="" style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover" }} />}
      <h1>{profile.display_name}</h1>
      <p>{profile.short_description}</p>
      <small>{[profile.city, profile.region].filter(Boolean).join(", ")}</small>
    </header>
    <nav style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
      {actions.map((action) => <a key={`${action.action_type}-${action.label}`} href={action.href} style={{ background: accent, color: "white", padding: 12, textAlign: "center", textDecoration: "none", borderRadius: 10 }}>{action.label}</a>)}
    </nav>
    {blocks.map((block) => <section key={block.id} style={{ borderTop: "1px solid #e5e7eb", marginTop: 28, paddingTop: 18 }}>
      <h2>{block.title ?? block.module_key.replaceAll("_", " ")}</h2>
      <p>This {block.module_key} block is enabled. Its public component loads data through the CyberCheck API.</p>
    </section>)}
  </main>;
}
