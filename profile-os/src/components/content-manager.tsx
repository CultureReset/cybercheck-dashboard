"use client";
import { useEffect, useState } from "react";

const kindFor: Record<string, string> = { menu: "menu", shop: "shop", catalog: "catalog", events: "events", live_session: "songs" };
export function ContentManager({ profileId, moduleKey }: { profileId: string; moduleKey: string }) {
  const kind = kindFor[moduleKey]; const [items, setItems] = useState<Array<{ id: string; title: string; summary?: string | null; price_from?: number | null }>>([]); const [title, setTitle] = useState(""); const [summary, setSummary] = useState(""); const [price, setPrice] = useState(""); const [notice, setNotice] = useState("");
  const load = async () => { if (!kind) return; const r = await fetch(`/api/studio/profiles/${profileId}/content?kind=${kind}`); if (r.ok) setItems((await r.json()).items); };
  useEffect(() => { void load(); }, [profileId, kind]);
  if (!kind) return null;
  async function add(event: React.FormEvent) { event.preventDefault(); const r = await fetch(`/api/studio/profiles/${profileId}/content`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, title, summary, price }) }); if (!r.ok) return setNotice("Could not add that item."); setTitle(""); setSummary(""); setPrice(""); setNotice("Saved."); await load(); }
  async function remove(id: string) { const r = await fetch(`/api/studio/profiles/${profileId}/content`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, kind }) }); if (!r.ok) return setNotice("Could not delete."); setNotice("Deleted."); await load(); }
  const label = kind === "menu" ? "menu item" : kind === "shop" ? "product" : kind === "events" ? "event" : kind === "songs" ? "song" : "item";
  return <section className="content-manager"><span className="studio-eyebrow">{label.toUpperCase()} MANAGER</span><h3>Add {label}s</h3><form onSubmit={add}><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${label} name`} required /><input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Short description" />{kind !== "events" && <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="Price (optional)" />}<button className="publish">Add {label}</button></form>{notice && <small className="form-message">{notice}</small>}<div className="content-list">{items.map((item) => <div key={item.id}><strong>{item.title}</strong><span>{item.price_from == null ? item.summary : `$${item.price_from}`}</span><button type="button" onClick={() => void remove(item.id)} aria-label="Delete">×</button></div>)}</div></section>;
}
