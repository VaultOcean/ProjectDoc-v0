"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, LayoutTemplate } from "lucide-react";
import { TemplatePicker } from "@/components/template-picker";
import type { TemplateMeta } from "@/lib/note-templates";

export function NewDocButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  async function create(template?: TemplateMeta) {
    if (busy) return;
    setBusy(true);
    setShowPicker(false);
    try {
      const body = template
        ? { title: template.defaultTitle, content: template.content }
        : {};
      const res = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) router.push(`/workspace/${data.id}`);
      else setBusy(false);
    } catch {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => create()} className="btn-tide" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          New document
        </button>
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          title="Start from a security template"
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-3 py-2 font-mono text-[11px] text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-40"
        >
          <LayoutTemplate className="h-3.5 w-3.5" />
          Template
        </button>
      </div>

      {showPicker && (
        <TemplatePicker
          onSelect={(t) => create(t)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
