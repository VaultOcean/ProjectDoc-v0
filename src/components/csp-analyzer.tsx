"use client";

import { useState } from "react";
import { Loader2, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

type Finding = { id: string; title: string; severity: string; detail: string; fix?: string };
type Directive = { name: string; values: string[] };

const SEV_COLOR: Record<string, string> = {
  high:   "text-orange-400 border-orange-400/30 bg-orange-400/8",
  medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/8",
  low:    "text-blue-400 border-blue-400/30 bg-blue-400/8",
  good:   "text-tide border-tide/30 bg-tide/8",
  info:   "text-ink-secondary border-hair bg-abyss-800/40",
};

const EXAMPLES = [
  "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'",
  "default-src *; script-src * 'unsafe-inline' 'unsafe-eval'",
  "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'",
];

export function CspAnalyzer() {
  const [header, setHeader] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ directives: Directive[]; findings: Finding[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    if (!header.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/csp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header: header.trim() }),
      });
      const data = await res.json() as { ok: boolean; directives?: Directive[]; findings?: Finding[]; error?: string };
      if (!data.ok) { setError(data.error ?? "Analysis failed."); return; }
      setResult({ directives: data.directives ?? [], findings: data.findings ?? [] });
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-14 space-y-4">
      <p className="overline mb-5">Inline CSP analyzer — paste and inspect</p>

      <form onSubmit={analyze} className="space-y-3">
        <textarea
          value={header}
          onChange={(e) => setHeader(e.target.value)}
          placeholder={`default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'`}
          rows={3}
          className="w-full rounded-lg border border-hair bg-abyss-800 px-4 py-3 font-mono text-sm text-ink-primary outline-none placeholder:text-ink-faint transition-colors focus:border-tide/50 focus:ring-1 focus:ring-tide/20 resize-none"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={loading || !header.trim()} className="btn-tide disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze"}
          </button>
          <span className="font-mono text-[11px] text-ink-faint">or try an example:</span>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setHeader(ex)}
              className="rounded-full border border-hair px-3 py-1 font-mono text-[10px] text-ink-muted transition-colors hover:border-tide/30 hover:text-tide"
            >
              Example {i + 1}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <p className="rounded-lg border border-sev-high/30 bg-sev-high/8 px-4 py-3 font-mono text-sm text-sev-high">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-4">
          {/* Parsed directives */}
          <div className="card p-5">
            <p className="label-mono mb-3">Parsed directives ({result.directives.length})</p>
            <div className="space-y-1.5">
              {result.directives.map((d) => (
                <div key={d.name} className="flex items-start gap-3">
                  <span className="font-mono text-[11px] text-tide shrink-0 w-36">{d.name}</span>
                  <span className="font-mono text-[11px] text-ink-secondary">{d.values.join(" ") || "(no value)"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Findings */}
          <div className="space-y-2">
            {result.findings.map((f) => (
              <div key={f.id} className={cn("rounded-xl border px-4 py-3", SEV_COLOR[f.severity] ?? SEV_COLOR.info)}>
                <div className="flex items-start gap-2.5">
                  {f.severity === "good"
                    ? <CheckCircle className="h-3.5 w-3.5 text-tide shrink-0 mt-0.5" />
                    : f.severity === "info"
                    ? <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    : <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-mono text-sm font-medium">{f.title}</p>
                    <p className="mt-0.5 text-sm opacity-80">{f.detail}</p>
                    {f.fix && (
                      <code className="mt-2 block rounded bg-abyss-900/60 px-3 py-1.5 font-mono text-[11px] text-tide">
                        {f.fix}
                      </code>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
