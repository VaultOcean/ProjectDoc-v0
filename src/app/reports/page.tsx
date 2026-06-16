"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FileText, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Report = {
  id: string; title: string; severity: string; status: string;
  cvssScore: number; platform: string; programName: string;
  createdAt: string; target: { id: string; domain: string } | null;
};

const SEV_COLOR: Record<string, string> = {
  critical: "text-red-400 bg-red-400/10 border-red-400/20",
  high:     "text-orange-400 bg-orange-400/10 border-orange-400/20",
  medium:   "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  low:      "text-blue-400 bg-blue-400/10 border-blue-400/20",
  info:     "text-zinc-400 bg-zinc-800 border-zinc-700",
};
const STATUS_COLOR: Record<string, string> = {
  draft: "text-zinc-500", submitted: "text-yellow-400", triaged: "text-blue-400",
  resolved: "text-tide", informative: "text-zinc-500", duplicate: "text-zinc-500", "n/a": "text-zinc-500",
};

const ALL_STATUSES = ["draft","submitted","triaged","resolved","informative","duplicate","n/a"];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/reports").then((r) => r.json())
      .then((d: { reports?: Report[] }) => { setReports(d.reports ?? []); setLoading(false); });
  }, []);

  const displayed = filter ? reports.filter((r) => r.status === filter) : reports;

  const bySev: Record<string, number> = {};
  for (const r of reports) bySev[r.severity] = (bySev[r.severity] ?? 0) + 1;

  const totalBounty = reports.reduce((s, r) => s + 0, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Vulnerability Reports</h1>
          <p className="mt-1 text-sm text-zinc-400">Draft, track, and export professional bug reports with CVSS 3.1 scoring.</p>
        </div>
        <Link href="/reports/new"
          className="flex items-center gap-2 rounded-lg bg-tide px-4 py-2 text-sm font-semibold text-abyss-900 transition hover:bg-tide/90">
          <Plus className="h-4 w-4" /> New Report
        </Link>
      </div>

      {/* Stats row */}
      {reports.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {Object.entries(bySev).map(([s, n]) => (
            <span key={s} className={cn("rounded-full border px-3 py-1 text-xs font-semibold", SEV_COLOR[s] ?? SEV_COLOR.info)}>
              {s} × {n}
            </span>
          ))}
        </div>
      )}

      {/* Filter */}
      {reports.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button onClick={() => setFilter("")}
            className={cn("rounded-full px-3 py-1 text-xs", !filter ? "bg-tide text-abyss-900 font-semibold" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200")}>
            All
          </button>
          {ALL_STATUSES.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={cn("rounded-full px-3 py-1 text-xs capitalize", filter === s ? "bg-zinc-700 text-zinc-100 font-semibold" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200")}>
              {s}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading reports…</div>
      ) : displayed.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 p-10 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
          <p className="text-sm text-zinc-400">{reports.length === 0 ? "No reports yet. Write your first vulnerability report." : "No reports match this filter."}</p>
          {reports.length === 0 && (
            <Link href="/reports/new" className="mt-3 inline-flex items-center gap-1 rounded-lg bg-tide px-4 py-2 text-sm font-semibold text-abyss-900">
              <Plus className="h-4 w-4" /> New Report
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((r) => (
            <Link key={r.id} href={`/reports/${r.id}`}
              className="group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 transition hover:border-zinc-700">
              <span className={cn("shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold uppercase", SEV_COLOR[r.severity] ?? SEV_COLOR.info)}>
                {r.severity}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-zinc-100">{r.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
                  {r.target && <span>{r.target.domain}</span>}
                  {r.platform && <span>{r.platform}</span>}
                  {r.programName && <span>· {r.programName}</span>}
                  {r.cvssScore > 0 && <span className="font-mono">CVSS {r.cvssScore.toFixed(1)}</span>}
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <span className={cn("shrink-0 text-xs capitalize", STATUS_COLOR[r.status] ?? "text-zinc-400")}>{r.status}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-zinc-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
