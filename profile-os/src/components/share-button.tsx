"use client";

export function ShareButton({ title, path }: { title: string; path: string }) {
  async function share() {
    const url = typeof window !== "undefined" ? new URL(path, window.location.origin).toString() : path;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      alert("Link copied");
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        alert("Link copied");
      } catch { /* ignore */ }
    }
  }
  return <button type="button" aria-label="Share profile" onClick={() => void share()}>↗</button>;
}
