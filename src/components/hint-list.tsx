"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";

export function HintList({ hints }: { hints: string[] }) {
  const [shown, setShown] = useState(0);
  if (hints.length === 0) return null;

  return (
    <div className="space-y-2">
      {hints.slice(0, shown).map((h, i) => (
        <p key={i} className="rounded-lg border border-hair bg-abyss-800 px-4 py-2.5 font-mono text-[13px] text-ink-secondary">
          <span className="text-hop">hint {i + 1}:</span> {h}
        </p>
      ))}
      {shown < hints.length && (
        <button
          type="button"
          onClick={() => setShown((s) => s + 1)}
          className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted transition-colors hover:text-hop"
        >
          <Lightbulb className="h-3.5 w-3.5" />
          reveal hint {shown + 1} of {hints.length}
        </button>
      )}
    </div>
  );
}
