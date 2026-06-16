"use client";

import { useState } from "react";
import { Search, Loader2, Download, Globe, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type Hit = { name: string; firstSeen: string };
type Result = { domain: string; count: number; subdomains: Hit[]; source: string };

export function SubdomainFinder() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/subdomains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const d = await res.json() as (Result & { ok: boolean; error?: string });
      if (!d.ok) { setError(d.error ?? "Lookup failed"); return; }
      setResult(d);
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (!result) return;
    const csv = "name,firstSeen\n" + result.subdomains.map((s) => `${s.name},${s.firstSeen}`).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${result.domain}-subdomains.csv`;
    a.click();
  }

  const filtered = filter
    ? result?.subdomains.filter((s) => s.name.includes(filter.toLowerCase()))
    : result?.subdomains;

  return (
    <div className="mt-14 space-y-4">
      <p className="overline mb-5">Subdomain finder — certificate transparency</p>

      <form onSubmit={run} className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            className="w-full rounded-lg border border-hair bg-abyss-800 py-3 pl-9 pr-4 font-mono text-sm text-ink-primary outline-none placeholder:text-ink-faint transition-colors focus:border-tide/50 focus:ring-1 focus:ring-tide/20"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !domain.trim()}
          className="btn-tide px-5 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-sev-high/30 bg-sev-high/8 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-sev-high shrink-0" />
          <p className="font-mono text-sm text-sev-high">{error}</p>
        </div>
      )}

      {loading && (
        <div className="card flex items-center justify-center gap-3 py-12 text-ink-faint">
          <Loader2 className="h-5 w-5 animate-spin text-tide" />
          <div>
            <p className="font-mono text-sm">Querying certificate transparency logs…</p>
            <p className="mt-1 font-mono text-[10px] text-ink-faint">This can take up to 15 seconds.</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          {/* Summary card */}
          <div className="card flex items-center gap-5 p-5">
            <div>
              <p className="display text-3xl text-tide">{result.count}</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-muted">subdomains</p>
            </div>
            <div className="h-10 w-px bg-hair" />
            <div>
              <p className="font-mono text-sm font-medium text-ink-primary">{result.domain}</p>
              <p className="mt-0.5 font-mono text-[11px] text-ink-faint">{result.source}</p>
            </div>
            <button
              onClick={exportCsv}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-hair px-3 py-2 font-mono text-xs text-ink-muted transition-colors hover:border-hover hover:text-ink-primary"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>

          {/* Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter results…"
              className="w-full rounded-lg border border-hair bg-abyss-800/60 py-2 pl-8 pr-3 font-mono text-xs text-ink-primary outline-none placeholder:text-ink-faint focus:border-tide/40"
            />
          </div>

          {/* Results */}
          <div className="card overflow-hidden">
            <div className="max-h-96 overflow-y-auto divide-y divide-hair">
              {(filtered ?? []).slice(0, 200).map((s) => (
                <div key={s.name} className="flex items-center gap-3 px-4 py-2.5">
                  <CheckCircle className="h-3 w-3 shrink-0 text-tide/50" />
                  <span className="flex-1 font-mono text-xs text-ink-primary">{s.name}</span>
                  <span className="font-mono text-[10px] text-ink-faint">
                    {new Date(s.firstSeen).getFullYear()}
                  </span>
                  <a
                    href={`https://${s.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] text-ink-faint transition-colors hover:text-tide"
                  >
                    visit →
                  </a>
                </div>
              ))}
              {filtered?.length === 0 && (
                <p className="px-4 py-6 text-center font-mono text-sm text-ink-faint">No results match.</p>
              )}
            </div>
          </div>

          <p className="font-mono text-[10px] text-ink-faint">
            Data from crt.sh (certificate transparency logs). Passive only — no active scanning.
          </p>
        </div>
      )}
    </div>
  );
}
