import Link from "next/link";

const demos = [
  { slug: "tide-table-demo", name: "Tide Table Demo", blurb: "Gulf seafood restaurant — menu, happy hour, live music." },
  { slug: "wave-room-demo", name: "Wave Room Demo", blurb: "Artist page — shows, live requests, merch." },
  { slug: "coast-key-demo", name: "Coast Key Demo", blurb: "Realtor page — listings, open houses, valuation leads." }
];

export default function HomePage() {
  return (
    <main className="landing">
      <section className="landing-hero">
        <span className="studio-eyebrow">CYBERCHECK PROFILE OS</span>
        <h1>Modular public profiles for local businesses.</h1>
        <p>Install apps, stack blocks, publish a phone-ready page — restaurants, artists, realtors, and hybrids on one engine.</p>
        <div className="landing-actions">
          <Link className="publish" href="/login">Sign in to Studio</Link>
          <Link className="auth-switch" href="/dashboard">Open dashboard</Link>
        </div>
      </section>
      <section className="landing-demos">
        <span className="studio-eyebrow">DEMO PROFILES</span>
        <div className="landing-grid">
          {demos.map((demo) => (
            <Link key={demo.slug} className="landing-card" href={`/${demo.slug}`}>
              <h2>{demo.name}</h2>
              <p>{demo.blurb}</p>
              <span>Open /{demo.slug} ›</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
