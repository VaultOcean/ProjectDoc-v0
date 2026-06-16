"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";

/* ── CVSS 3.1 score calculation ─────────────────────────────────────────── */
const AV  = { N: 0.85, A: 0.62, L: 0.55, P: 0.2  } as const;
const AC  = { L: 0.77, H: 0.44 } as const;
const PR_U = { N: 0.85, L: 0.62, H: 0.27 } as const;
const PR_C = { N: 0.85, L: 0.68, H: 0.50 } as const;
const UI  = { N: 0.85, R: 0.62 } as const;
const CIA = { N: 0.0,  L: 0.22, H: 0.56 } as const;

type AVKey  = keyof typeof AV;
type ACKey  = keyof typeof AC;
type PRKey  = keyof typeof PR_U;
type UIKey  = keyof typeof UI;
type SKey   = "U" | "C";
type CIAKey = keyof typeof CIA;

type Metrics = {
  AV: AVKey; AC: ACKey; PR: PRKey; UI: UIKey;
  S: SKey; C: CIAKey; I: CIAKey; A: CIAKey;
};

function calcCvss(m: Metrics): number {
  const prVal = m.S === "C" ? PR_C[m.PR] : PR_U[m.PR];
  const iss = 1 - (1 - CIA[m.C]) * (1 - CIA[m.I]) * (1 - CIA[m.A]);
  let impact: number;
  if (m.S === "U") {
    impact = 6.42 * iss;
  } else {
    impact = 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
  }
  const exploitability = 8.22 * AV[m.AV] * AC[m.AC] * prVal * UI[m.UI];
  if (impact <= 0) return 0;
  const base = m.S === "U"
    ? Math.min(impact + exploitability, 10)
    : Math.min(1.08 * (impact + exploitability), 10);
  return Math.ceil(base * 10) / 10;
}

function vectorString(m: Metrics) {
  return `CVSS:3.1/AV:${m.AV}/AC:${m.AC}/PR:${m.PR}/UI:${m.UI}/S:${m.S}/C:${m.C}/I:${m.I}/A:${m.A}`;
}

function severity(score: number): { label: string; color: string } {
  if (score === 0)     return { label: "None",     color: "text-zinc-400" };
  if (score < 4)      return { label: "Low",      color: "text-blue-400" };
  if (score < 7)      return { label: "Medium",   color: "text-yellow-400" };
  if (score < 9)      return { label: "High",     color: "text-orange-400" };
  return               { label: "Critical", color: "text-red-400" };
}

type Option = { label: string; value: string; desc: string };

const GROUPS: { metric: keyof Metrics; label: string; abbr: string; options: Option[] }[] = [
  { metric: "AV", label: "Attack Vector", abbr: "AV", options: [
    { value: "N", label: "Network",  desc: "Exploitable remotely over the internet." },
    { value: "A", label: "Adjacent", desc: "Attack must originate from the same network segment." },
    { value: "L", label: "Local",    desc: "Attacker must have local access." },
    { value: "P", label: "Physical", desc: "Requires physical access to the target." },
  ]},
  { metric: "AC", label: "Attack Complexity", abbr: "AC", options: [
    { value: "L", label: "Low",  desc: "No special conditions required." },
    { value: "H", label: "High", desc: "Exploit requires specific conditions." },
  ]},
  { metric: "PR", label: "Privileges Required", abbr: "PR", options: [
    { value: "N", label: "None", desc: "No authentication needed." },
    { value: "L", label: "Low",  desc: "Requires basic user privileges." },
    { value: "H", label: "High", desc: "Requires admin/elevated privileges." },
  ]},
  { metric: "UI", label: "User Interaction", abbr: "UI", options: [
    { value: "N", label: "None",     desc: "No user action required." },
    { value: "R", label: "Required", desc: "Requires a user to take an action (e.g. click a link)." },
  ]},
  { metric: "S", label: "Scope", abbr: "S", options: [
    { value: "U", label: "Unchanged", desc: "Exploit is confined to the vulnerable component." },
    { value: "C", label: "Changed",   desc: "Exploit affects resources beyond the authorization scope." },
  ]},
  { metric: "C", label: "Confidentiality", abbr: "C", options: [
    { value: "N", label: "None", desc: "No confidentiality impact." },
    { value: "L", label: "Low",  desc: "Limited information disclosure." },
    { value: "H", label: "High", desc: "Total confidentiality loss (all data accessible)." },
  ]},
  { metric: "I", label: "Integrity", abbr: "I", options: [
    { value: "N", label: "None", desc: "No integrity impact." },
    { value: "L", label: "Low",  desc: "Modification of some data possible." },
    { value: "H", label: "High", desc: "Total integrity loss (attacker can modify all data)." },
  ]},
  { metric: "A", label: "Availability", abbr: "A", options: [
    { value: "N", label: "None", desc: "No availability impact." },
    { value: "L", label: "Low",  desc: "Reduced performance or partial availability loss." },
    { value: "H", label: "High", desc: "Total availability loss (service completely down)." },
  ]},
];

const DEFAULT: Metrics = { AV: "N", AC: "L", PR: "N", UI: "N", S: "U", C: "L", I: "L", A: "L" };

type Props = {
  onChange?: (score: number, vector: string, severity: string) => void;
  initialVector?: string;
};

function parseVector(v: string): Metrics | null {
  try {
    const parts: Record<string, string> = {};
    for (const seg of v.split("/").slice(1)) {
      const [k, val] = seg.split(":");
      parts[k] = val;
    }
    return {
      AV: parts.AV as AVKey, AC: parts.AC as ACKey, PR: parts.PR as PRKey,
      UI: parts.UI as UIKey, S: parts.S as SKey,
      C: parts.C as CIAKey, I: parts.I as CIAKey, A: parts.A as CIAKey,
    };
  } catch { return null; }
}

export function CvssCalculator({ onChange, initialVector }: Props) {
  const [metrics, setMetrics] = useState<Metrics>(() => {
    if (initialVector) return parseVector(initialVector) ?? DEFAULT;
    return DEFAULT;
  });

  const score   = calcCvss(metrics);
  const vector  = vectorString(metrics);
  const sev     = severity(score);

  useEffect(() => { onChange?.(score, vector, sev.label); }, [score, vector, sev.label]); // eslint-disable-line react-hooks/exhaustive-deps

  function set(metric: keyof Metrics, value: string) {
    setMetrics((m) => ({ ...m, [metric]: value }));
  }

  const scoreColor =
    score === 0 ? "text-zinc-400" :
    score < 4   ? "text-blue-400" :
    score < 7   ? "text-yellow-400" :
    score < 9   ? "text-orange-400" : "text-red-400";

  const barColor =
    score === 0 ? "bg-zinc-600" :
    score < 4   ? "bg-blue-500" :
    score < 7   ? "bg-yellow-500" :
    score < 9   ? "bg-orange-500" : "bg-red-500";

  return (
    <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/60 p-5">
      {/* Score display */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className={cn("font-mono text-4xl font-bold tabular-nums", scoreColor)}>{score.toFixed(1)}</div>
          <div className={cn("mt-0.5 font-mono text-sm font-semibold uppercase tracking-widest", sev.color)}>{sev.label}</div>
        </div>
        <div className="text-right">
          <div className="mb-1 font-mono text-[10px] text-zinc-500">CVSS 3.1 Vector</div>
          <div className="max-w-xs break-all font-mono text-[10px] text-zinc-400">{vector}</div>
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div className={cn("h-full rounded-full transition-all duration-300", barColor)} style={{ width: `${score * 10}%` }} />
      </div>

      {/* Metric selectors */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {GROUPS.map((g) => (
          <div key={g.metric} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <div className="mb-2 font-mono text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{g.label}</div>
            <div className="flex flex-wrap gap-1.5">
              {g.options.map((opt) => {
                const active = metrics[g.metric] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set(g.metric, opt.value)}
                    title={opt.desc}
                    className={cn(
                      "rounded px-2.5 py-1 font-mono text-xs transition-all",
                      active
                        ? "bg-tide text-abyss-900 font-semibold"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                    )}
                  >
                    {g.abbr}:{opt.value} <span className="ml-1 opacity-70">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
