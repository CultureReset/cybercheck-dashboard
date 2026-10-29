"use client";
import { useState } from "react";

export function PublicLeadForm({ slug, blockKey, config }: { slug: string; blockKey: string; config: Record<string, unknown> | null }) {
  const [status, setStatus] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); setStatus("Sending…"); const response = await fetch(`/api/public/${slug}/forms`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: form.get("name"), contact: form.get("contact"), message: form.get("message"), blockKey }) }); setStatus(response.ok ? "Thanks — we’ll be in touch." : "Please check the form and try again."); if (response.ok) event.currentTarget.reset(); }
  return <form className="lead-form" onSubmit={submit}><p>{String(config?.description ?? "Tell us what you need and we’ll get back to you.")}</p><input name="name" aria-label="Your name" placeholder="Your name" required /><input name="contact" aria-label="Email or phone" placeholder="Email or phone" required /><input name="message" aria-label="Message" placeholder="How can we help?" /><button type="submit">{String(config?.button_label ?? "Send inquiry")}</button>{status && <small className="form-message">{status}</small>}</form>;
}
