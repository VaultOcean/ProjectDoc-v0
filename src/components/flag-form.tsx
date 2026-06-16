"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";

type Result = { ok: boolean; message: string } | null;

export function FlagForm({ slug, solved }: { slug: string; solved?: boolean }) {
  const router = useRouter();
  const [flag, setFlag] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);

  if (solved) {
    return (
      <p className="inline-flex items-center gap-1.5 font-mono text-sm text-tide">
        <Check className="h-4 w-4" /> Solved
      </p>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!flag.trim() || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/arena/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, flag }),
      });
      const data = await res.json();
      setResult({ ok: !!data.ok, message: data.message ?? data.error ?? "Try again." });
      if (data.ok && data.recorded) router.refresh();
    } catch {
      setResult({ ok: false, message: "Network error. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        value={flag}
        onChange={(e) => setFlag(e.target.value)}
        placeholder="VO{...}"
        maxLength={256}
        autoComplete="off"
        spellCheck={false}
        className="flex-1 rounded-lg border border-hair bg-abyss-800 px-4 py-2.5 font-mono text-sm text-ink-primary placeholder:text-ink-faint focus:border-hover"
        aria-label="Flag"
      />
      <button type="submit" className="btn-tide justify-center" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
      </button>
      {result && (
        <span
          className={`inline-flex items-center gap-1.5 font-mono text-sm ${
            result.ok ? "text-tide" : "text-sev-high"
          }`}
          role="status"
        >
          {result.ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {result.message}
        </span>
      )}
    </form>
  );
}
