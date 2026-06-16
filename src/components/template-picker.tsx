"use client";

import { X, ShieldAlert, Search, AlertTriangle, ClipboardList, Target, Shield } from "lucide-react";
import { NOTE_TEMPLATES } from "@/lib/note-templates";
import type { TemplateMeta } from "@/lib/note-templates";
import { cn } from "@/lib/cn";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "bug-report":    ShieldAlert,
  "recon":         Search,
  "cve-analysis":  AlertTriangle,
  "methodology":   ClipboardList,
  "program-review": Target,
  "threat-model":  Shield,
};

const COLOR_MAP: Record<string, string> = {
  "bug-report":    "text-red-400    border-red-900/50    bg-red-950/40",
  "recon":         "text-cyan-400   border-cyan-900/50   bg-cyan-950/40",
  "cve-analysis":  "text-orange-400 border-orange-900/50 bg-orange-950/40",
  "methodology":   "text-violet-400 border-violet-900/50 bg-violet-950/40",
  "program-review":"text-green-400  border-green-900/50  bg-green-950/40",
  "threat-model":  "text-blue-400   border-blue-900/50   bg-blue-950/40",
};

export function TemplatePicker({
  onSelect,
  onClose,
}: {
  onSelect: (t: TemplateMeta) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-800 bg-[#0d0d10] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 py-4">
          <div>
            <p className="font-display text-sm font-semibold text-zinc-200">Security Templates</p>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-600">Pick a starting structure for your note</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3">
          {NOTE_TEMPLATES.map((t) => {
            const Icon  = ICON_MAP[t.id] ?? ShieldAlert;
            const color = COLOR_MAP[t.id] ?? "text-zinc-400 border-zinc-800 bg-zinc-900";
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t)}
                className="group flex flex-col gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-900/70"
              >
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[13px] font-medium leading-snug text-zinc-300 transition-colors group-hover:text-zinc-100">
                    {t.name}
                  </p>
                  <p className="mt-1 font-mono text-[9px] leading-relaxed text-zinc-600">{t.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Blank */}
        <div className="border-t border-zinc-800/80 px-5 py-3">
          <button
            onClick={onClose}
            className="font-mono text-[10px] text-zinc-700 transition-colors hover:text-zinc-500"
          >
            Start blank instead
          </button>
        </div>
      </div>
    </div>
  );
}
