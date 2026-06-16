"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
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
const STATUSES   = ["draft","submitted","triaged","resolved","informative","duplicate","n/a"];
const PLATFORMS  = ["HackerOne","Bugcrowd","Intigriti","YesWeHack","SynAck","Cobalt","Private","Custom"];

type Report = {
  id: string; title: string; severity: string; status: string;
  cvssVector: string; cvssScore: number; endpoint: string; parameter: string;
  poc: string; impact: string; remediation: string; httpRequest: string; httpResponse: string;
  platform: string; programName: string; bountyUSD: number | null;
};

export default function EditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [title,       setTitle]       = useState("");
  const [severity,    setSeverity]    = useState("medium");
  const [cvssVector,  setCvssVector]  = useState("");
  const [cvssScore,   setCvssScore]   = useState(0);
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
  const [loading,     setLoading]     = useState(true);
  const [err,         setErr]         = useState("");
  const [tab,         setTab]         = useState<"info"|"cvss"|"poc"|"http">("info");

  useEffect(() => {
    fetch(`/api/reports/${id}`).then((r) => r.json()).then((d: { report?: Report }) => {
      if (d.report) {
        const r = d.report;
        setTitle(r.title); setSeverity(r.severity); setCvssVector(r.cvssVector);
        setCvssScore(r.cvssScore); setEndpoint(r.endpoint); setParameter(r.parameter);
        setPoc(r.poc); setImpact(r.impact); setRemediation(r.remediation);
        setHttpReq(r.httpRequest); setHttpRes(r.httpResponse);
        setStatus(r.status); setPlatform(r.platform); setProgramName(r.programName);
        setBountyUSD(r.bountyUSD != null ? String(r.bountyUSD) : "");
      }
      setLoading(false);
    });
  }, [id]);

  async function save() {
    if (!title.trim()) { setErr("Title is required."); return; }
    setSaving(true); setErr("");
    const res = await fetch(`/api/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, severity, cvssVector, cvssScore, endpoint, parameter,
        poc, impact, remediation, httpRequest: httpReq, httpResponse: httpRes,
        status, platform, programName,
        bountyUSD: bountyUSD ? parseFloat(bountyUSD) : null,
      }),
    }).then((r) => r.json()) as { ok?: boolean; error?: string };
    setSaving(false);
    if (!res.ok) { setErr(res.error ?? "Error"); return; }
    router.push(`/reports/${id}`);
  }

  const TABS: { key: "info"|"cvss"|"poc"|"http"; label: string }[] = [
    { key: "info", label: "Details" },
    { key: "cvss", label: "CVSS 3.1" },
    { key: "poc",  label: "PoC + Impact" },
    { key: "http", label: "HTTP" },
  ];

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading report…
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href={`/reports/${id}`} className="mb-4 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300">
        <ChevronLeft className="h-4 w-4" /> Back to Report
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">Edit Report</h1>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-tide px-4 py-2 text-sm font-semibold text-abyss-900 disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-zinc-700 bg-zinc-900/80 p-5">
        <div className="mb-3">
          <label className="mb-1 block text-xs text-zinc-400">Report Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-tide" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SEVERITIES.map((s) => (
            <button key={s} type="button" onClick={() => setSeverity(s)}
              className={cn("rounded border px-2 py-1 text-[11px] font-semibold uppercase transition",
                severity === s ? `${SEV_COLOR[s]} bg-zinc-800` : "border-zinc-700 text-zinc-500 hover:text-zinc-300")}>
              {s}
            </button>
          ))}
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
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

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
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-tide" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Parameter</label>
              <input value={parameter} onChange={(e) => setParameter(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-tide" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Bounty (USD)</label>
            <input type="number" value={bountyUSD} onChange={(e) => setBountyUSD(e.target.value)}
              className="w-32 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide" />
          </div>
        </div>
      )}

      {tab === "cvss" && (
        <CvssCalculator
          initialVector={cvssVector}
          onChange={(score, vector) => { setCvssScore(score); setCvssVector(vector); }}
        />
      )}

      {tab === "poc" && (
        <div className="space-y-3 rounded-xl border border-zinc-700 bg-zinc-900/80 p-5">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Proof of Concept</label>
            <textarea value={poc} onChange={(e) => setPoc(e.target.value)} rows={8}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-tide" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Impact</label>
            <textarea value={impact} onChange={(e) => setImpact(e.target.value)} rows={4}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Remediation</label>
            <textarea value={remediation} onChange={(e) => setRemediation(e.target.value)} rows={4}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-tide" />
          </div>
        </div>
      )}

      {tab === "http" && (
        <div className="space-y-3 rounded-xl border border-zinc-700 bg-zinc-900/80 p-5">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">HTTP Request</label>
            <textarea value={httpReq} onChange={(e) => setHttpReq(e.target.value)} rows={10}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-300 outline-none focus:border-tide" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">HTTP Response</label>
            <textarea value={httpRes} onChange={(e) => setHttpRes(e.target.value)} rows={10}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-300 outline-none focus:border-tide" />
          </div>
        </div>
      )}

      {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
    </div>
  );
}
