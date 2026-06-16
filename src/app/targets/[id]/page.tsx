"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Globe, ChevronLeft, Plus, Save, Terminal, FileText, DollarSign, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/cn";

type ReconEntry = { id: string; kind: string; data: string; createdAt: string };
type Report     = { id: string; title: string; severity: string; status: string; createdAt: string };
type Sub        = { id: string; title: string; severity: string; status: string; bountyUSD: number | null; submittedAt: string };
type Target     = {
  id: string; domain: string; name: string; program: string; platform: string;
  scope: string; outScope: string; notes: string; status: string;
  recons: ReconEntry[]; reports: Report[]; submissions: Sub[];
};

const SEV_COLOR: Record<string, string> = {
  critical: "text-red-400 bg-red-400/10 border-red-400/20",
  high:     "text-orange-400 bg-orange-400/10 border-orange-400/20",
  medium:   "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  low:      "text-blue-400 bg-blue-400/10 border-blue-400/20",
  info:     "text-zinc-400 bg-zinc-800 border-zinc-700",
};

const STATUS_COLOR: Record<string, string> = {
  draft:       "text-zinc-400",
  submitted:   "text-yellow-400",
  triaged:     "text-blue-400",
  resolved:    "text-tide",
  informative: "text-zinc-500",
  duplicate:   "text-zinc-500",
};

export default function TargetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [target, setTarget] = useState<Target | null>(null);
  const [tab, setTab] = useState<"notes" | "recon" | "reports" | "earnings">("recon");
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  async function load() {
    const d = await fetch(`/api/targets/${id}`).then((r) => r.json()) as { target?: Target };
    if (d.target) { setTarget(d.target); setNotes(d.target.notes); }
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveNotes() {
    if (!target) return;
    setSavingNotes(true);
    await fetch(`/api/targets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSavingNotes(false);
  }

  if (!target) return (
    <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading target…
    </div>
  );

  const scope    = JSON.parse(target.scope)    as string[];
  const outScope = JSON.parse(target.outScope) as string[];

  const TABS = [
    { key: "recon",    label: "Recon",     icon: Terminal,  count: target.recons.length },
    { key: "reports",  label: "Reports",   icon: FileText,  count: target.reports.length },
    { key: "earnings", label: "Earnings",  icon: DollarSign,count: target.submissions.length },
    { key: "notes",    label: "Notes",     icon: FileText,  count: null },
  ] as const;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <Link href="/targets" className="mb-4 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300">
        <ChevronLeft className="h-4 w-4" /> All Targets
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-6 w-6 text-tide" />
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">{target.domain}</h1>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              {target.platform && <span>{target.platform}</span>}
              {target.program && <span>· {target.program}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/reports/new?targetId=${id}&domain=${encodeURIComponent(target.domain)}`}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700">
            <Plus className="h-3.5 w-3.5" /> Report
          </Link>
          <Link href={`/terminal`}
            className="flex items-center gap-1.5 rounded-lg bg-tide px-3 py-1.5 text-sm font-semibold text-abyss-900">
            <Terminal className="h-3.5 w-3.5" /> Run Terminal
          </Link>
        </div>
      </div>

      {/* Scope */}
      {(scope.length > 0 || outScope.length > 0) && (
        <div className="mb-5 grid grid-cols-2 gap-3">
          {scope.length > 0 && (
            <div className="rounded-lg border border-tide/20 bg-tide/5 p-3">
              <div className="mb-2 text-xs font-semibold text-tide">In Scope</div>
              {scope.map((s) => <div key={s} className="font-mono text-xs text-zinc-300">{s}</div>)}
            </div>
          )}
          {outScope.length > 0 && (
            <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-3">
              <div className="mb-2 text-xs font-semibold text-red-400">Out of Scope</div>
              {outScope.map((s) => <div key={s} className="font-mono text-xs text-zinc-300">{s}</div>)}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-zinc-800 pb-0">
        {TABS.map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setTab(key as typeof tab)}
            className={cn("flex items-center gap-1.5 border-b-2 px-3 pb-2 text-sm transition",
              tab === key ? "border-tide text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300")}>
            <Icon className="h-3.5 w-3.5" />
            {label}
            {count !== null && <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px]">{count}</span>}
          </button>
        ))}
      </div>

      {/* Recon tab */}
      {tab === "recon" && (
        <div className="space-y-2">
          {target.recons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center">
              <Terminal className="mx-auto mb-2 h-6 w-6 text-zinc-600" />
              <p className="text-sm text-zinc-400">No recon saved yet.</p>
              <p className="mt-1 text-xs text-zinc-600">Run <code className="font-mono">subdomains {target.domain}</code> in the Terminal, then save to this target.</p>
            </div>
          ) : target.recons.map((r) => {
            const parsed = (() => { try { return JSON.parse(r.data); } catch { return null; } })();
            return (
              <div key={r.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-300">{r.kind}</span>
                  <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                    <Clock className="h-3 w-3" /> {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                <pre className="max-h-48 overflow-auto rounded bg-zinc-950 p-3 font-mono text-[11px] text-zinc-300">
                  {typeof parsed === "object" ? JSON.stringify(parsed, null, 2) : String(parsed)}
                </pre>
              </div>
            );
          })}
        </div>
      )}

      {/* Reports tab */}
      {tab === "reports" && (
        <div className="space-y-2">
          {target.reports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center">
              <FileText className="mx-auto mb-2 h-6 w-6 text-zinc-600" />
              <p className="text-sm text-zinc-400">No vulnerability reports yet.</p>
              <Link href={`/reports/new?targetId=${id}&domain=${encodeURIComponent(target.domain)}`}
                className="mt-3 inline-flex items-center gap-1 rounded-lg bg-tide px-3 py-1.5 text-sm font-semibold text-abyss-900">
                <Plus className="h-3.5 w-3.5" /> Write Report
              </Link>
            </div>
          ) : target.reports.map((r) => (
            <Link key={r.id} href={`/reports/${r.id}`}
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 transition hover:border-zinc-700">
              <span className={cn("rounded border px-2 py-0.5 text-[10px] font-semibold uppercase", SEV_COLOR[r.severity] ?? SEV_COLOR.info)}>{r.severity}</span>
              <span className="flex-1 text-sm text-zinc-200">{r.title}</span>
              <span className={cn("text-xs", STATUS_COLOR[r.status] ?? "text-zinc-400")}>{r.status}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Earnings tab */}
      {tab === "earnings" && (
        <div className="space-y-2">
          {target.submissions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center">
              <DollarSign className="mx-auto mb-2 h-6 w-6 text-zinc-600" />
              <p className="text-sm text-zinc-400">No submissions logged yet.</p>
            </div>
          ) : target.submissions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
              <span className={cn("rounded border px-2 py-0.5 text-[10px] font-semibold uppercase", SEV_COLOR[s.severity] ?? SEV_COLOR.info)}>{s.severity}</span>
              <span className="flex-1 text-sm text-zinc-200">{s.title}</span>
              {s.bountyUSD != null && <span className="font-mono text-sm font-semibold text-tide">${s.bountyUSD.toFixed(0)}</span>}
              <span className={cn("text-xs", STATUS_COLOR[s.status] ?? "text-zinc-400")}>{s.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Notes tab */}
      {tab === "notes" && (
        <div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            rows={16}
            placeholder={`# Notes for ${target.domain}\n\n- Initial recon on...\n- Interesting endpoint: /api/...\n- TODO: check rate limiting on /login`}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 font-mono text-sm text-zinc-200 outline-none focus:border-tide" />
          <button onClick={saveNotes} disabled={savingNotes}
            className="mt-2 flex items-center gap-2 rounded-lg bg-tide px-4 py-2 text-sm font-semibold text-abyss-900 disabled:opacity-60">
            {savingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Notes
          </button>
        </div>
      )}
    </div>
  );
}
