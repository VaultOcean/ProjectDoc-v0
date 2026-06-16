"use client";

import { useState } from "react";
import { Search, Loader2, Shield, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

type Severity = "critical" | "high" | "medium" | "low" | "good" | "info";

type Finding = {
  id: string;
  title: string;
  severity: Severity;
  detail: string;
  fix?: string;
};

type ScanResult = {
  target: string;
  grade: string;
  score: number;
  findings: Finding[];
  present: { name: string; value: string }[];
};

const SEV_COLOR: Record<Severity, string> = {
  critical: "text-red-400 border-red-400/30 bg-red-400/8",
  high:     "text-orange-400 border-orange-400/30 bg-orange-400/8",
  medium:   "text-yellow-400 border-yellow-400/30 bg-yellow-400/8",
  low:      "text-blue-400 border-blue-400/30 bg-blue-400/8",
  good:     "text-tide border-tide/30 bg-tide/8",
  info:     "text-ink-secondary border-hair bg-abyss-800/40",
};

const GRADE_COLOR: Record<string, string> = {
  "A+": "text-tide", A: "text-tide", B: "text-yellow-400",
  C: "text-orange-400", D: "text-orange-400", F: "text-red-400",
};

function SevIcon({ s }: { s: Severity }) {
  if (s === "good") return <CheckCircle className="h-3.5 w-3.5 text-tide shrink-0" />;
  if (s === "info") return <Info className="h-3.5 w-3.5 text-ink-muted shrink-0" />;
  return <AlertTriangle className="h-3.5 w-3.5 shrink-0" />;
}

export function ToolScanner() {
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!target.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: target.trim() }),
      });
      const data = await res.json() as ScanResult & { ok: boolean; error?: string };
      if (!data.ok) { setError(data.error ?? "Scan failed."); return; }
      setResult(data);
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  const issues = result?.findings.filter((f) => f.severity !== "good" && f.severity !== "info") ?? [];
  const passes = result?.findings.filter((f) => f.severity === "good") ?? [];

  return (
    <div className="mt-14 space-y-4">
      <p className="overline mb-5">Live scanner — try it now</p>

      <form onSubmit={run} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="github.com"
            className="w-full rounded-lg border border-hair bg-abyss-800 py-3 pl-9 pr-4 font-mono text-sm text-ink-primary outline-none placeholder:text-ink-faint transition-colors focus:border-tide/50 focus:ring-1 focus:ring-tide/20"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !target.trim()}
          className="btn-tide px-5 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Scan"}
        </button>
      </form>

      {error && (
        <p className="rounded-lg border border-sev-high/30 bg-sev-high/8 px-4 py-3 font-mono text-sm text-sev-high">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-4">
          {/* Grade card */}
          <div className="card flex items-center gap-6 p-5">
            <div className="text-center">
              <p className={cn("display text-5xl font-bold", GRADE_COLOR[result.grade] ?? "text-ink-primary")}>
                {result.grade}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted">grade</p>
            </div>
            <div className="h-12 w-px bg-hair" />
            <div>
              <p className="font-display text-lg text-ink-primary">{result.target}</p>
              <p className="mt-0.5 font-mono text-sm text-ink-secondary">
                Score: <span className="text-tide">{result.score}/100</span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-ink-faint">
                {issues.length} issue{issues.length !== 1 ? "s" : ""} · {passes.length} pass{passes.length !== 1 ? "es" : ""}
              </p>
            </div>
            <div className="ml-auto hidden gap-2 sm:flex">
              <Shield className="h-10 w-10 text-hair" />
            </div>
          </div>

          {/* Findings */}
          <div className="space-y-2">
            {result.findings.map((f) => (
              <div key={f.id} className={cn("rounded-xl border px-4 py-3", SEV_COLOR[f.severity])}>
                <div className="flex items-start gap-2.5">
                  <SevIcon s={f.severity} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-medium">{f.title}</p>
                      <span className={cn("rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider border", SEV_COLOR[f.severity])}>
                        {f.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed opacity-80">{f.detail}</p>
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

          {/* Headers present */}
          {result.present.length > 0 && (
            <div className="card p-5">
              <p className="label-mono mb-3">Headers detected</p>
              <div className="space-y-1.5">
                {result.present.map((h) => (
                  <div key={h.name} className="flex items-start gap-3">
                    <span className="font-mono text-[11px] text-tide shrink-0 w-48 truncate">{h.name}</span>
                    <span className="font-mono text-[11px] text-ink-muted truncate">{h.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
