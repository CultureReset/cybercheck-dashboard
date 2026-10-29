import { MODULE_KEYS, moduleRegistry } from "../../lib/modules";

export default function Dashboard() {
  return <main style={{ maxWidth: 1000, margin: "0 auto", padding: 32, fontFamily: "Arial, sans-serif" }}>
    <h1>CyberCheck Profile OS</h1>
    <p>Dashboard shell: choose a profile, enable applications, configure blocks, then publish.</p>
    <h2>Application registry</h2>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
      {MODULE_KEYS.map((key) => <article key={key} style={{ border: "1px solid #ddd", padding: 16, borderRadius: 12 }}><strong>{moduleRegistry[key].name}</strong><p>{moduleRegistry[key].description}</p><button>Enable for profile</button></article>)}
    </div>
  </main>;
}
