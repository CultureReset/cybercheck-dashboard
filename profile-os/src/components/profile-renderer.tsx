"use client";
import { useState } from "react";
import { moduleRegistry, type ModuleKey } from "../lib/modules";
import { PublicLeadForm } from "./public-lead-form";

type Entry = { id: string; title: string; summary?: string | null; price_from?: number | null; primary_image_url?: string | null };
type Event = { id: string; title: string; description?: string | null; event_kind?: string | null; starts_at?: string | null };
type Block = { id: string; module_key: string; block_key: string; title: string | null; config: Record<string, unknown> | null; data?: { entries?: Entry[]; events?: Event[]; products?: Entry[] } };
type Props = { profile: { slug: string; display_name: string; short_description: string | null; cover_url: string | null; logo_url: string | null; theme: Record<string, string> | null; city: string | null; region: string | null }; actions: Array<{ label: string; href: string; action_type: string }>; blocks: Block[] };
const money = (amount?: number | null) => amount == null ? null : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: amount >= 1000 ? 0 : 2 }).format(amount);
const blockTone = (block: Block) => String(block.config?.style ?? "glass");

function Items({ items, compact = false }: { items: Entry[]; compact?: boolean }) {
  if (!items.length) return <p className="empty-state">Add items from the dashboard to bring this block to life.</p>;
  return <div className={compact ? "item-list compact" : "item-list"}>{items.map((item) => <article className="item-card" key={item.id}>{item.primary_image_url ? <img src={item.primary_image_url} alt="" /> : <span className="item-art">{item.title.slice(0, 1)}</span>}<div><strong>{item.title}</strong>{item.summary && <p>{item.summary}</p>}</div>{money(item.price_from) && <b>{money(item.price_from)}</b>}</article>)}</div>;
}
function EventCards({ events }: { events: Event[] }) {
  if (!events.length) return <p className="empty-state">Schedule an event, an open house, or a live set.</p>;
  return <div className="event-list">{events.map((event) => <article key={event.id} className="event-card"><span className="event-date">{event.starts_at ? new Date(event.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "UP"}</span><div><strong>{event.title}</strong><p>{event.description ?? event.event_kind}</p></div><span>›</span></article>)}</div>;
}
function LiveBlock({ block }: { block: Block }) {
  const [requested, setRequested] = useState(false);
  return <div className="live-block"><span className="live-pill"><i /> live now</span><h3>{block.config?.headline?.toString() ?? "Make a request"}</h3><p>Scan, choose, and move your favorite to the top of the queue.</p><button onClick={() => setRequested(true)} disabled={requested}>{requested ? "Request sent" : "Request something ›"}</button></div>;
}
function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return <button aria-label="Share profile" onClick={share}>{copied ? "Copied" : "↗"}</button>;
}
function BookingBlock() {
  return <div className="module-ready"><span>◫</span><p>Choose a service and request a time. Availability and confirmation will appear here.</p><button type="button">Request a booking</button></div>;
}
function ReviewsBlock() {
  return <div className="module-ready"><span>★</span><p>Guest reviews and ratings will show here once they are submitted and approved.</p></div>;
}
function GalleryBlock() {
  return <div className="module-ready"><span>▧</span><p>Photos and videos from the gallery will appear in a grid here.</p></div>;
}
function SmsBlock() {
  const [joined, setJoined] = useState(false);
  return <div className="module-ready"><span>⌁</span><p>Get updates, specials, and alerts by text.</p>{!joined ? <form onSubmit={(e) => { e.preventDefault(); setJoined(true); }}><input type="tel" placeholder="Mobile number" required /><button type="submit">Join text club</button></form> : <p>You're on the list. Watch for a confirmation text.</p>}</div>;
}
function AnalyticsBlock() {
  return <div className="module-ready"><span>◱</span><p>Page views, scans, and clicks are tracked. Detailed analytics are available in the studio.</p></div>;
}
function TipsBlock() {
  return <div className="module-ready"><span>♥</span><p>Leave a tip for the team.</p><button type="button">Send a tip</button></div>;
}
function ContentWallBlock() {
  return <div className="module-ready"><span>≡</span><p>Posts, updates, and exclusive content will appear here.</p></div>;
}
function LoyaltyBlock() {
  return <div className="module-ready"><span>◎</span><p>Earn points and rewards. Join the loyalty program to start collecting.</p><button type="button">Join rewards</button></div>;
}
function AiMediaBlock() {
  return <div className="module-ready"><span>✧</span><p>AI-generated covers, promos, and photos will be available here.</p></div>;
}
function TeamBlock() {
  return <div className="module-ready"><span>◉</span><p>Team members and staff roles will be listed here.</p></div>;
}
const blockComponents: Record<string, (block: Block, slug: string) => React.ReactNode> = {
  menu: (block) => <Items items={block.data?.entries ?? []} compact />,
  catalog: (block) => <Items items={block.data?.entries ?? []} />,
  shop: (block) => <Items items={block.data?.products ?? block.data?.entries ?? []} />,
  events: (block) => <EventCards events={block.data?.events ?? []} />,
  live_session: (block) => <LiveBlock block={block} />,
  lead_forms: (block, slug) => <PublicLeadForm slug={slug} blockKey={block.block_key} config={block.config} />,
  specials: (block) => <Items items={block.data?.entries ?? []} compact />,
  booking: () => <BookingBlock />,
  reviews: () => <ReviewsBlock />,
  gallery: () => <GalleryBlock />,
  sms_opt_in: () => <SmsBlock />,
  analytics: () => <AnalyticsBlock />,
  tips: () => <TipsBlock />,
  content_wall: () => <ContentWallBlock />,
  loyalty: () => <LoyaltyBlock />,
  ai_media: () => <AiMediaBlock />,
  team: () => <TeamBlock />
};

export function ProfileRenderer({ profile, actions, blocks }: Props) {
  const accent = profile.theme?.accent ?? "#10b981";
  const location = [profile.city, profile.region].filter(Boolean).join(", ");
  const shareUrl = typeof window !== "undefined" ? window.location.href : `/${profile.slug}`;
  return <main className="public-page" style={{ "--accent": accent } as React.CSSProperties}><div className="page-shell"><section className="profile-hero" style={profile.cover_url ? { backgroundImage: `linear-gradient(180deg, transparent 15%, #0b1020 100%), url(${profile.cover_url})` } : undefined}><div className="hero-top"><span className="brand-mark">cc</span><ShareButton title={profile.display_name} url={shareUrl} /></div><div className="identity">{profile.logo_url ? <img src={profile.logo_url} alt="" /> : <span className="identity-fallback">{profile.display_name.slice(0, 1)}</span>}<div><p className="eyebrow">{location || "Your local link"}</p><h1>{profile.display_name}</h1><p className="hero-copy">{profile.short_description}</p></div></div></section>{actions.length > 0 && <nav className="quick-actions">{actions.map((action) => <a key={`${action.action_type}-${action.label}`} href={`/api/public/${profile.slug}/actions?href=${encodeURIComponent(action.href)}&label=${encodeURIComponent(action.label)}`}><span>{action.label}</span><b>›</b></a>)}</nav>}<div className="block-stack">{blocks.map((block) => { const component = blockComponents[String(block.config?.component ?? block.module_key)]; const module = moduleRegistry[block.module_key as ModuleKey]; return <section key={block.id} className={`profile-block tone-${blockTone(block)}`} id={`block-${block.block_key}`}><div className="block-heading"><div><span className="module-kicker" style={{ color: module?.accent }}>{module?.icon} {module?.name ?? "Custom app"}</span><h2>{block.title ?? module?.name ?? "Custom app"}</h2></div>{["menu", "catalog", "events", "shop"].includes(block.module_key) && <a className="text-button" href={`#block-${block.block_key}`}>See all</a>}</div>{component ? component(block, profile.slug) : <div className="module-ready"><span>{module?.icon ?? "◈"}</span><p>{module?.description ?? "This installed custom app is ready to configure."}</p></div>}</section>; })}</div><footer>Powered by <b>CyberCheck</b></footer></div></main>;
}
