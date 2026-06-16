"use client";

import { useState } from "react";
import { Radar, Loader2, AlertTriangle, ShieldCheck, Globe, FileCode, Server } from "lucide-react";
import { LiveSurfaceMap } from "@/components/console/live-surface-map";
import type { ScanResult } from "@/lib/queries";

const SEV: Record<string, string> = {
  critical: "#ff6470", high: "#ff9f43", medium: "#ffd166", low: "#9aa7b8", good: "#5dd0a0", info: "var(--c-accent)",
};
function gradeColor(g: string): string {
  if (g.startsWith("A")) return "#5dd0a0";
  if (g === "B") return "var(--c-accent)";
  if (g === "C") return "#ffd166";
  if (g === "D") return "#ff9f43";
  return "#ff6470";
}

export function ScanExperience({ initial }: { initial: ScanResult | null }) {
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(initial);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!target.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/console/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!data.ok) setError(data.error ?? "Scan failed.");
      else setResult(data.result as ScanResult);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Launcher */}
      <form onSubmit={run} className="c-card c-rise flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-2.5">
        <div className="flex flex-1 items-center gap-2.5 px-3">
          <Radar className="h-4 w-4 shrink-0" style={{ color: "var(--c-accent)" }} />
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Scan any domain — e.g. example.com"
            spellCheck={false}
            autoCapitalize="off"
            className="w-full bg-transparent py-2 text-[15px] outline-none"
            style={{ color: "var(--c-text)" }}
            aria-label="Domain to scan"
          />
        </div>
        <button type="submit" className="c-btn c-btn-accent justify-center" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
          {busy ? "Scanning…" : "Run scan"}
        </button>
      </form>

      {error && (
        <div className="c-card flex items-center gap-3 p-4" style={{ borderColor: "rgba(255,100,112,0.3)" }}>
          <AlertTriangle className="h-4 w-4" style={{ color: "#ff6470" }} />
          <span className="text-[14px]">{error}</span>
        </div>
      )}

      {busy && !result && <ScanSkeleton />}

      {result && (
        <>
          {/* Summary */}
          <section className="grid gap-4 lg:grid-cols-[auto_1fr]">
            <div className="c-card c-rise flex items-center gap-5 p-6">
              <GradeRing grade={result.grade} score={result.score} />
              <div>
                <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>Security posture</p>
                <p className="text-[20px] font-medium tracking-tight">{result.target}</p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--c-faint)" }}>
                  scanned {new Date(result.scannedAt).toLocaleString()} · HTTP {result.status}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Mini label="Findings" value={result.findings.filter((f) => f.severity !== "good").length} />
              <Mini label="Critical / High" value={result.findings.filter((f) => f.severity === "critical" || f.severity === "high").length} tone="#ff8a8a" />
              <Mini label="Assets found" value={result.subdomains.length} />
              <Mini label="DNS records" value={result.dns.a.length + result.dns.aaaa.length + result.dns.mx.length + result.dns.ns.length} />
            </div>
          </section>

          {/* Surface map + findings */}
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="c-card c-rise lg:col-span-2">
              <div className="flex items-center justify-between px-6 pt-5">
                <div>
                  <p className="text-[15px] font-medium">Attack surface — {result.target}</p>
                  <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>{result.subdomains.length} assets from certificate transparency</p>
                </div>
                <span className="c-chip"><Globe className="h-3 w-3" /> live</span>
              </div>
              <div className="h-[340px] px-2 pb-2">
                {result.subdomains.length > 0
                  ? <LiveSurfaceMap center={result.target} assets={result.subdomains} />
                  : <Empty icon={Globe} text="No public subdomains surfaced in CT logs for this domain." />}
              </div>
            </div>

            <div className="c-card c-rise p-5">
              <p className="mb-4 text-[15px] font-medium">Findings</p>
              <div className="space-y-3">
                {result.findings.slice(0, 8).map((f) => (
                  <div key={f.id} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: SEV[f.severity] }} />
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-medium leading-snug">{f.title}</p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed" style={{ color: "var(--c-muted)" }}>{f.detail}</p>
                      {f.fix && (
                        <code className="mt-1.5 block overflow-x-auto rounded-md px-2 py-1 text-[11px]" style={{ background: "var(--c-surface-2)", color: "var(--c-accent)" }}>
                          {f.fix}
                        </code>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Headers + DNS */}
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="c-card c-rise p-6">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" style={{ color: "var(--c-accent)" }} />
                <p className="text-[15px] font-medium">Security headers present</p>
              </div>
              {result.present.length === 0 ? (
                <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>None of the key security headers were set.</p>
              ) : (
                <div className="space-y-2">
                  {result.present.map((h) => (
                    <div key={h.name} className="c-glass px-3 py-2">
                      <p className="text-[12px] font-medium">{h.name}</p>
                      <p className="mt-0.5 truncate text-[11px]" style={{ color: "var(--c-muted)" }}>{h.value}</p>
                    </div>
                  ))}
                </div>
              )}
              {result.csp && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <FileCode className="h-4 w-4" style={{ color: "var(--c-accent)" }} />
                    <p className="text-[14px] font-medium">CSP directives</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.csp.directives.map((d) => <span key={d.name} className="c-chip">{d.name}</span>)}
                  </div>
                </div>
              )}
            </div>

            <div className="c-card c-rise p-6">
              <div className="mb-4 flex items-center gap-2">
                <Server className="h-4 w-4" style={{ color: "var(--c-accent)" }} />
                <p className="text-[15px] font-medium">DNS &amp; assets</p>
              </div>
              <DnsRow label="A" items={result.dns.a} />
              <DnsRow label="AAAA" items={result.dns.aaaa} />
              <DnsRow label="MX" items={result.dns.mx} />
              <DnsRow label="NS" items={result.dns.ns} />
              {result.subdomains.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--c-faint)" }}>Subdomains</p>
                  <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                    {result.subdomains.map((s) => <span key={s} className="c-chip !text-[11px]">{s}</span>)}
                  </div>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function GradeRing({ grade, score }: { grade: string; score: number }) {
  const r = 30; const circ = 2 * Math.PI * r; const dash = (score / 100) * circ; const color = gradeColor(grade);
  return (
    <div className="relative h-[84px] w-[84px] shrink-0">
      <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90">
        <circle cx="42" cy="42" r={r} fill="none" stroke="var(--c-surface-2)" strokeWidth="7" />
        <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[24px] font-medium leading-none" style={{ color }}>{grade}</span>
        <span className="text-[10px]" style={{ color: "var(--c-faint)" }}>{score}/100</span>
      </div>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="c-card c-rise c-hover p-4">
      <p className="text-[12px]" style={{ color: "var(--c-muted)" }}>{label}</p>
      <p className="mt-1.5 text-[26px] font-medium leading-none tracking-tight" style={tone ? { color: tone } : undefined}>{value}</p>
    </div>
  );
}

function DnsRow({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-2 flex gap-3 text-[12.5px]">
      <span className="w-12 shrink-0 font-mono" style={{ color: "var(--c-faint)" }}>{label}</span>
      <span className="min-w-0 break-all" style={{ color: "var(--c-muted)" }}>{items.join(", ")}</span>
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof Globe; text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <Icon className="h-6 w-6" style={{ color: "var(--c-faint)" }} />
      <p className="max-w-xs text-[13px]" style={{ color: "var(--c-muted)" }}>{text}</p>
    </div>
  );
}

function ScanSkeleton() {
  return (
    <div className="space-y-4">
      <div className="c-skel h-24" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="c-skel h-[380px] lg:col-span-2" />
        <div className="c-skel h-[380px]" />
      </div>
    </div>
  );
}
