"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Save, Loader2, Download } from "lucide-react";
import Link from "next/link";
import { CvssCalculator } from "@/components/cvss-calculator";
import { cn } from "@/lib/cn";

const SEVERITIES = ["critical","high","medium","low","info"] as const;
const SEV_COLOR: Record<string, string> = {
  critical: "border-red-500 text-red-400", high: "border-orange-500 text-orange-400",
  medium: "border-yellow-500 text-yellow-400", low: "border-blue-500 text-blue-400",
  info: "border-zinc-600 text-zinc-400",
};
const STATUSES = ["draft","submitted","triaged","resolved","informative","duplicate","n/a"];
const PLATFORMS = ["HackerOne","Bugcrowd","Intigriti","YesWeHack","SynAck","Cobalt","Private","Custom"];

function NewReportForm() {
  const router = useRouter();
  const params = useSearchParams();
  const prefillTargetId = params.get("targetId");
  const prefillDomain   = params.get("domain");

  const [title,       setTitle]       = useState("");
  const [severity,    setSeverity]    = useState<string>("medium");
  const [cvssVector,  setCvssVector]  = useState("");
  const [cvssScore,   setCvssScore]   = useState(0);
  const [cvssLabel,   setCvssLabel]   = useState("Medium");
  const [endpoint,    setEndpoint]    = useState("");
  const [parameter,   setParameter]  = useState("");
  const [poc,         setPoc]         = useState("");
  const [impact,      setImpact]      = useState("");
  const [remediation, setRemediation] = useState("");
  const [httpReq,     setHttpReq]     = useState("");
  const [httpRes,     setHttpRes]     = useState("");
  const [status,      setStatus]      = useState("draft");
  const [platform,    setPlatform]    = useState("");
  const [programName, setProgramName] = useState("");
  const [bountyUSD,   setBountyUSD]   = useState("");
  const [saving,      setSaving]      = useState(false);
  const [err,         setErr]         = useState("");
  const [tab,         setTab]         = useState<"info"|"cvss"|"poc"|"http">("info");

  useEffect(() => {
    if (cvssScore > 0) {
      if (cvssScore >= 9)       setSeverity("critical");
      else if (cvssScore >= 7)  setSeverity("high");
      else if (cvssScore >= 4)  setSeverity("medium");
      else if (cvssScore > 0)   setSeverity("low");
    }
  }, [cvssScore]);

  async function save(asStatus = status) {
    if (!title.trim()) { setErr("Title is required."); return; }
    setSaving(true); setErr("");
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, targetId: prefillTargetId ?? undefined, severity, cvssVector, cvssScore,
        endpoint, parameter, poc, impact, remediation,
        httpRequest: httpReq, httpResponse: httpRes,
        status: asStatus, platform, programName,
        bountyUSD: bountyUSD ? parseFloat(bountyUSD) : undefined,
      }),
    }).then((r) => r.json()) as { ok?: boolean; error?: string; report?: { id: string } };
    setSaving(false);
    if (!res.ok) { setErr(res.error ?? "Error"); return; }
    router.push(`/reports/${res.report!.id}`);
  }

  function exportMarkdown() {
    const md = [
      `# ${title}`,
      ``,
      `**Severity:** ${severity.toUpperCase()}  ${cvssScore > 0 ? `| **CVSS:** ${cvssScore.toFixed(1)}` : ""}`,
      cvssVector ? `**Vector:** \`${cvssVector}\`` : "",
      `**Status:** ${status}`,
      platform ? `**Platform:** ${platform}` : "",
      programName ? `**Program:** ${programName}` : "",
      ``,
      `## Endpoint`,
      `\`${endpoint || "—"}\``,
      parameter ? `**Parameter:** \`${parameter}\`` : "",
      ``,
      `## Proof of Concept`,
      poc || "—",
      ``,
      `## Impact`,
      impact || "—",
      ``,
      `## Remediation`,
      remediation || "—",
      httpReq ? `\n## HTTP Request\n\`\`\`http\n${httpReq}\n\`\`\`` : "",
      httpRes ? `\n## HTTP Response\n\`\`\`http\n${httpRes}\n\`\`\`` : "",
    ].filter((l) => l !== "").join("\n");

    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
  }

  const TABS: { key: "info"|"cvss"|"poc"|"http"; label: string }[] = [
    { key: "info", label: "Details" },
    { key: "cvss", label: "CVSS 3.1" },
    { key: "poc",  label: "PoC + Impact" },
    { key: "http", label: "HTTP" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/reports" className="mb-4 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300">
        <ChevronLeft className="h-4 w-4" /> Reports
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">New Vulnerability Report</h1>
        <div className="flex gap-2">
          <button onClick={exportMarkdown} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200">
            <Download className="h-4 w-4" /> Export MD
          </button>
          <button onClick={() => save("draft")} disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Draft
          </button>
          <button onClick={() => save("submitted")} disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-tide px-4 py-1.5 text-sm font-semibold text-abyss-900 disabled:opacity-60">
            Submit Report
          </button>
        </div>
      </div>

      {/* Title + severity */}
      <div className="mb-4 rounded-xl border border-zinc-700 bg-zinc-900/80 p-5">
        <div className="mb-3">
          <label className="mb-1 block text-xs text-zinc-400">Report Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Reflected XSS in search parameter allows cookie theft"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-tide" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Severity</label>
            <div className="flex flex-wrap gap-1.5">
              {SEVERITIES.map((s) => (
                <button key={s} type="button" onClick={() => setSeverity(s)}
                  className={cn("rounded border px-2 py-1 text-[11px] font-semibold uppercase transition",
                    severity === s ? `${SEV_COLOR[s]} bg-zinc-800` : "border-zinc-700 text-zinc-500 hover:text-zinc-300")}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Platform</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide">
              <option value="">Select</option>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Program</label>
            <input value={programName} onChange={(e) => setProgramName(e.target.value)}
              placeholder="acme-corp" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        {prefillDomain && <p className="mt-2 text-xs text-zinc-500">Target: <span className="font-mono text-zinc-400">{prefillDomain}</span></p>}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-zinc-800">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn("border-b-2 px-4 pb-2 text-sm transition",
              tab === key ? "border-tide text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300")}>
            {label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="space-y-3 rounded-xl border border-zinc-700 bg-zinc-900/80 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Endpoint URL</label>
              <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://target.com/api/search?q=" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-tide" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Vulnerable Parameter</label>
              <input value={parameter} onChange={(e) => setParameter(e.target.value)}
                placeholder="q" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-tide" />
            </div>
          </div>
          {cvssScore > 0 && (
            <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-sm">
              CVSS: <span className="font-mono font-bold text-tide">{cvssScore.toFixed(1)}</span>
              <span className="mx-2 text-zinc-500">·</span>
              <span className="text-zinc-400">{cvssLabel}</span>
              <span className="mx-2 text-zinc-500">·</span>
              <span className="font-mono text-[11px] text-zinc-500">{cvssVector}</span>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Bounty Received (USD)</label>
            <input type="number" value={bountyUSD} onChange={(e) => setBountyUSD(e.target.value)}
              placeholder="0" className="w-32 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide" />
          </div>
        </div>
      )}

      {tab === "cvss" && (
        <CvssCalculator onChange={(score, vector, label) => { setCvssScore(score); setCvssVector(vector); setCvssLabel(label); }} />
      )}

      {tab === "poc" && (
        <div className="space-y-3 rounded-xl border border-zinc-700 bg-zinc-900/80 p-5">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Proof of Concept (step-by-step)</label>
            <textarea value={poc} onChange={(e) => setPoc(e.target.value)} rows={8}
              placeholder={`1. Log in as a regular user.\n2. Navigate to /api/search?q=<script>alert(document.cookie)</script>\n3. Observe that the script executes, leaking session cookies.`}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-tide" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Impact</label>
            <textarea value={impact} onChange={(e) => setImpact(e.target.value)} rows={4}
              placeholder="An attacker can steal session cookies of any user who visits a crafted URL, leading to full account takeover."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Remediation</label>
            <textarea value={remediation} onChange={(e) => setRemediation(e.target.value)} rows={4}
              placeholder="Encode all user-supplied output before reflecting it in HTML. Use a Content-Security-Policy with nonces. Validate and sanitize inputs server-side."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide" />
          </div>
        </div>
      )}

      {tab === "http" && (
        <div className="space-y-3 rounded-xl border border-zinc-700 bg-zinc-900/80 p-5">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">HTTP Request</label>
            <textarea value={httpReq} onChange={(e) => setHttpReq(e.target.value)} rows={10}
              placeholder={`GET /api/search?q=<script>alert(1)</script> HTTP/2\nHost: target.com\nCookie: session=abc123\nAccept: application/json`}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-300 outline-none focus:border-tide" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">HTTP Response</label>
            <textarea value={httpRes} onChange={(e) => setHttpRes(e.target.value)} rows={10}
              placeholder={`HTTP/2 200 OK\nContent-Type: text/html; charset=utf-8\n\n<html>...<script>alert(1)</script>...`}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-300 outline-none focus:border-tide" />
          </div>
        </div>
      )}

      {err && <p className="mt-3 text-sm text-red-400">{err}</p>}

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={() => save("draft")} disabled={saving}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" /> Save Draft
        </button>
        <button onClick={() => save("submitted")} disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-tide px-5 py-2 text-sm font-semibold text-abyss-900 disabled:opacity-60">
          Submit Report
        </button>
      </div>
    </div>
  );
}

export default function NewReportPage() {
  return (
    <Suspense>
      <NewReportForm />
    </Suspense>
  );
}
