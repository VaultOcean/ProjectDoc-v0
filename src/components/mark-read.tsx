"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

export function MarkRead({ slug, loggedIn }: { slug: string; loggedIn: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function mark() {
    if (busy || done) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/writeups/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      setMsg(data.message ?? data.error ?? "Done.");
      if (data.ok) {
        setDone(true);
        router.refresh();
      }
    } catch {
      setMsg("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={mark} className="btn-tide" disabled={busy || done}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {done ? "Marked as read" : "Mark as read"}
      </button>
      <span className="font-mono text-xs text-ink-muted">
        {msg ??
          (loggedIn
            ? "marking as read keeps your streak alive"
            : "sign in to record this and keep your streak alive")}
      </span>
    </div>
  );
}
