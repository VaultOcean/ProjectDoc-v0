"use client";

import { useState, useEffect, useMemo } from "react";
import { ExternalLink, Search, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Program = {
  id: string; name: string; handle: string; platform: "HackerOne" | "Bugcrowd" | "Intigriti";
  url: string; minBounty: number | null; maxBounty: number | null; managed: boolean; launched: string | null;
};

const PLATFORM_COLORS: Record<string, string> = {
  HackerOne: "text-green-400 bg-green-400/10 border-green-400/20",
  Bugcrowd:  "text-orange-400 bg-orange-400/10 border-orange-400/20",
  Intigriti: "text-blue-400 bg-blue-400/10 border-blue-400/20",
};

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("");
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  async function load(force = false) {
    setLoading(true);
    const url = force ? "/api/programs?refresh=1" : "/api/programs";
    const d = await fetch(url).then((r) => r.json()).catch(() => ({ ok: false })) as { ok?: boolean; programs?: Program[] };
    setPrograms(d.programs ?? []);
    setLastFetch(new Date());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let items = programs;
    if (platform) items = items.filter((p) => p.platform === platform);
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q));
    }
    return items;
  }, [programs, query, platform]);

  const platforms = ["HackerOne", "Bugcrowd", "Intigriti"];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Bug Bounty Programs</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Public programs from HackerOne and Bugcrowd. Updated hourly. {programs.length > 0 && `${programs.length} programs loaded.`}
          </p>
        </div>
        <button onClick={() => load(true)} disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programs…"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none focus:border-tide" />
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setPlatform("")}
            className={cn("rounded-lg border px-3 py-2 text-xs", !platform ? "border-tide text-tide" : "border-zinc-700 text-zinc-400 hover:text-zinc-200")}>
            All
          </button>
          {platforms.map((p) => (
            <button key={p} onClick={() => setPlatform(p)}
              className={cn("rounded-lg border px-3 py-2 text-xs", platform === p ? `${PLATFORM_COLORS[p]}` : "border-zinc-700 text-zinc-400 hover:text-zinc-200")}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 text-xs text-zinc-500">
        {loading ? "Loading programs…" : `${filtered.length} programs`}
        {lastFetch && !loading && ` · Last updated ${lastFetch.toLocaleTimeString()}`}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 p-10 text-center">
          <p className="text-sm text-zinc-400">No programs found. Try a different search or refresh.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filtered.map((p) => (
            <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold", PLATFORM_COLORS[p.platform] ?? "text-zinc-400")}>
                    {p.platform}
                  </span>
                  {p.managed && (
                    <span className="rounded border border-tide/20 bg-tide/10 px-1.5 py-0.5 text-[10px] font-semibold text-tide">Managed</span>
                  )}
                </div>
                <div className="truncate text-sm font-medium text-zinc-100">{p.name}</div>
                <div className="mt-0.5 font-mono text-[11px] text-zinc-500">@{p.handle}</div>
                {(p.minBounty != null || p.maxBounty != null) && (
                  <div className="mt-1 font-mono text-xs text-tide">
                    ${p.minBounty ?? 0} – ${p.maxBounty ?? "?"}
                  </div>
                )}
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-zinc-400" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
