"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Target, Globe, ChevronRight, Archive, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type TargetItem = {
  id: string; domain: string; name: string; program: string; platform: string;
  status: string; updatedAt: string;
  _count: { recons: number; reports: number; submissions: number };
};

const SEV_COLOR: Record<string, string> = {
  active: "text-tide bg-tide/10 border-tide/20",
  archived: "text-zinc-500 bg-zinc-800 border-zinc-700",
};

export default function TargetsPage() {
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [domain, setDomain] = useState("");
  const [name, setName] = useState("");
  const [program, setProgram] = useState("");
  const [platform, setPlatform] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    const d = await fetch("/api/targets").then((r) => r.json()) as { targets?: TargetItem[] };
    setTargets(d.targets ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addTarget(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr("");
    const res = await fetch("/api/targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, name, program, platform }),
    }).then((r) => r.json()) as { ok?: boolean; error?: string; id?: string };
    setSaving(false);
    if (!res.ok) { setErr(res.error ?? "Error"); return; }
    setShowAdd(false); setDomain(""); setName(""); setProgram(""); setPlatform("");
    load();
  }

  async function archive(id: string) {
    await fetch(`/api/targets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    load();
  }

  async function del(id: string) {
    if (!confirm("Delete this target and all its recon/reports?")) return;
    await fetch(`/api/targets/${id}`, { method: "DELETE" });
    load();
  }

  const active   = targets.filter((t) => t.status === "active");
  const archived = targets.filter((t) => t.status === "archived");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Target Workspace</h1>
          <p className="mt-1 text-sm text-zinc-400">Save targets. Attach recon, reports, and submissions to each one.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg bg-tide px-4 py-2 text-sm font-semibold text-abyss-900 transition hover:bg-tide/90"
        >
          <Plus className="h-4 w-4" /> Add Target
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={addTarget} className="mb-6 rounded-xl border border-zinc-700 bg-zinc-900/80 p-5">
          <h2 className="mb-4 font-semibold text-zinc-200">New Target</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Domain *</label>
              <input required value={domain} onChange={(e) => setDomain(e.target.value)}
                placeholder="target.com" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Label (optional)</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide">
                <option value="">Select platform</option>
                {["HackerOne","Bugcrowd","Intigriti","YesWeHack","SynAck","Cobalt","Private","Custom"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Program handle</label>
              <input value={program} onChange={(e) => setProgram(e.target.value)}
                placeholder="acme-corp" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide" />
            </div>
          </div>
          {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-tide px-4 py-2 text-sm font-semibold text-abyss-900 disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Target
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading targets…</div>
      ) : targets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 p-10 text-center">
          <Target className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
          <p className="text-sm text-zinc-400">No targets yet. Add your first target to start tracking recon.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Active ({active.length})</h2>
              <div className="space-y-2">
                {active.map((t) => <TargetRow key={t.id} t={t} onArchive={archive} onDelete={del} />)}
              </div>
            </section>
          )}
          {archived.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Archived ({archived.length})</h2>
              <div className="space-y-2">
                {archived.map((t) => <TargetRow key={t.id} t={t} onArchive={archive} onDelete={del} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function TargetRow({ t, onArchive, onDelete }: { t: TargetItem; onArchive: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 transition hover:border-zinc-700">
      <Globe className="h-5 w-5 shrink-0 text-tide" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-zinc-100">{t.domain}</span>
          {t.name && <span className="text-xs text-zinc-500">{t.name}</span>}
          {t.platform && <span className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">{t.platform}</span>}
          <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold", t.status === "active" ? "text-tide bg-tide/10 border-tide/20" : "text-zinc-500 bg-zinc-800 border-zinc-700")}>
            {t.status}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-zinc-500">
          <span>{t._count.recons} recon runs</span>
          <span>{t._count.reports} reports</span>
          <span>{t._count.submissions} submissions</span>
          <span>Updated {new Date(t.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
        {t.status === "active" && (
          <button onClick={() => onArchive(t.id)} title="Archive" className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">
            <Archive className="h-4 w-4" />
          </button>
        )}
        <button onClick={() => onDelete(t.id)} title="Delete" className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </button>
        <Link href={`/targets/${t.id}`} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-tide">
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
