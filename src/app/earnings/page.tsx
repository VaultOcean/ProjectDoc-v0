"use client";

import { useState, useEffect } from "react";
import { Plus, DollarSign, TrendingUp, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Submission = {
  id: string; title: string; platform: string; program: string; severity: string;
  status: string; bountyUSD: number | null; submittedAt: string; notes: string;
  target: { id: string; domain: string } | null;
};
type Stats = {
  total: number; earned: number; count: number;
  byPlatform: Record<string, number>; bySeverity: Record<string, number>;
};

const SEV_COLOR: Record<string, string> = {
  critical: "text-red-400 bg-red-400/10 border-red-400/20",
  high:     "text-orange-400 bg-orange-400/10 border-orange-400/20",
  medium:   "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  low:      "text-blue-400 bg-blue-400/10 border-blue-400/20",
  info:     "text-zinc-400 bg-zinc-800 border-zinc-700",
};
const STATUS_COLOR: Record<string, string> = {
  submitted: "text-yellow-400", triaged: "text-blue-400", resolved: "text-tide",
  informative: "text-zinc-500", duplicate: "text-zinc-500", "n/a": "text-zinc-500",
};
const PLATFORMS = ["HackerOne","Bugcrowd","Intigriti","YesWeHack","SynAck","Cobalt","Private","Custom"];
const SEVERITIES = ["critical","high","medium","low","info"];
const STATUSES   = ["submitted","triaged","resolved","informative","duplicate","n/a"];

export default function EarningsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [title,    setTitle]    = useState("");
  const [platform, setPlatform] = useState("HackerOne");
  const [program,  setProgram]  = useState("");
  const [severity, setSeverity] = useState("medium");
  const [status,   setStatus]   = useState("submitted");
  const [bounty,   setBounty]   = useState("");
  const [date,     setDate]     = useState(new Date().toISOString().slice(0,10));
  const [notes,    setNotes]    = useState("");

  async function load() {
    const d = await fetch("/api/earnings").then((r) => r.json()) as { submissions?: Submission[]; stats?: Stats };
    setSubmissions(d.submissions ?? []);
    setStats(d.stats ?? null);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addSubmission(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !program) { setErr("Title and program are required."); return; }
    setSaving(true); setErr("");
    const res = await fetch("/api/earnings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, platform, program, severity, status, bountyUSD: bounty ? parseFloat(bounty) : undefined, submittedAt: date, notes }),
    }).then((r) => r.json()) as { ok?: boolean; error?: string };
    setSaving(false);
    if (!res.ok) { setErr(res.error ?? "Error"); return; }
    setShowAdd(false); setTitle(""); setProgram(""); setBounty(""); setNotes("");
    load();
  }

  async function updateStatus(id: string, newStatus: string) {
    await fetch(`/api/earnings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  async function del(id: string) {
    if (!confirm("Delete this submission?")) return;
    await fetch(`/api/earnings/${id}`, { method: "DELETE" });
    load();
  }

  const resolved   = submissions.filter((s) => s.status === "resolved");
  const totalEarned = resolved.reduce((sum, s) => sum + (s.bountyUSD ?? 0), 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Earnings Tracker</h1>
          <p className="mt-1 text-sm text-zinc-400">Log bug bounty submissions, track status, calculate earnings.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg bg-tide px-4 py-2 text-sm font-semibold text-abyss-900 hover:bg-tide/90">
          <Plus className="h-4 w-4" /> Log Submission
        </button>
      </div>

      {/* Stats */}
      {stats && stats.count > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Submitted" value={String(stats.count)} icon={<TrendingUp className="h-5 w-5 text-zinc-400" />} />
          <StatCard label="Total Earned" value={`$${totalEarned.toLocaleString()}`} icon={<DollarSign className="h-5 w-5 text-tide" />} highlight />
          <StatCard label="Resolved" value={String(resolved.length)} icon={<DollarSign className="h-5 w-5 text-zinc-400" />} />
          <StatCard label="Avg Bounty" value={resolved.length > 0 ? `$${(totalEarned / resolved.length).toFixed(0)}` : "—"} icon={<TrendingUp className="h-5 w-5 text-zinc-400" />} />
        </div>
      )}

      {/* Platform breakdown */}
      {stats && Object.keys(stats.byPlatform).length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {Object.entries(stats.byPlatform).map(([p, amt]) => (
            <div key={p} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm">
              <span className="text-zinc-400">{p}:</span> <span className="font-mono font-semibold text-tide">${amt.toFixed(0)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <form onSubmit={addSubmission} className="mb-6 rounded-xl border border-zinc-700 bg-zinc-900/80 p-5">
          <h2 className="mb-4 font-semibold text-zinc-200">Log Submission</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-400">Title *</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Reflected XSS in search parameter" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide">
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Program *</label>
              <input required value={program} onChange={(e) => setProgram(e.target.value)}
                placeholder="acme-corp" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Severity</label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide">
                {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Bounty (USD)</label>
              <input type="number" value={bounty} onChange={(e) => setBounty(e.target.value)}
                placeholder="0" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Submitted Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide" />
            </div>
          </div>
          {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-tide px-4 py-2 text-sm font-semibold text-abyss-900 disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : submissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 p-10 text-center">
          <DollarSign className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
          <p className="text-sm text-zinc-400">No submissions yet. Log your first bug bounty submission.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map((s) => (
            <div key={s.id} className="group rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 transition hover:border-zinc-700">
              <div className="flex items-center gap-3">
                <span className={cn("shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold uppercase", SEV_COLOR[s.severity] ?? SEV_COLOR.info)}>
                  {s.severity}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-100">{s.title}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
                    <span>{s.platform} · {s.program}</span>
                    <span>{new Date(s.submittedAt).toLocaleDateString()}</span>
                    {s.target && <span>· {s.target.domain}</span>}
                  </div>
                </div>
                {s.bountyUSD != null && s.bountyUSD > 0 && (
                  <span className="font-mono text-sm font-semibold text-tide">${s.bountyUSD.toLocaleString()}</span>
                )}
                <select
                  value={s.status}
                  onChange={(e) => updateStatus(s.id, e.target.value)}
                  className={cn("rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs outline-none", STATUS_COLOR[s.status] ?? "text-zinc-400")}
                >
                  {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
                <button onClick={() => del(s.id)} className="rounded p-1 text-zinc-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, highlight }: { label: string; value: string; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-4", highlight ? "border-tide/20 bg-tide/5" : "border-zinc-800 bg-zinc-900/60")}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        {icon}
      </div>
      <div className={cn("font-mono text-xl font-bold", highlight ? "text-tide" : "text-zinc-100")}>{value}</div>
    </div>
  );
}
