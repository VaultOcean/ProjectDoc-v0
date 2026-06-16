"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ChevronLeft, Edit2, Download, Loader2, Globe } from "lucide-react";
import { cn } from "@/lib/cn";

type Report = {
  id: string; title: string; severity: string; status: string;
  cvssVector: string; cvssScore: number; endpoint: string; parameter: string;
  poc: string; impact: string; remediation: string; httpRequest: string; httpResponse: string;
  platform: string; programName: string; bountyUSD: number | null;
  createdAt: string; updatedAt: string; submittedAt: string | null;
  target: { id: string; domain: string; name: string } | null;
};

const SEV_COLOR: Record<string, string> = {
  critical: "text-red-400 bg-red-400/10 border-red-400/20",
  high:     "text-orange-400 bg-orange-400/10 border-orange-400/20",
  medium:   "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  low:      "text-blue-400 bg-blue-400/10 border-blue-400/20",
  info:     "text-zinc-400 bg-zinc-800 border-zinc-700",
};
const STATUS_COLOR: Record<string, string> = {
  draft: "text-zinc-500", submitted: "text-yellow-400", triaged: "text-blue-400",
  resolved: "text-tide", informative: "text-zinc-500", duplicate: "text-zinc-500", "n/a": "text-zinc-500",
};

const STATUSES = ["draft","submitted","triaged","resolved","informative","duplicate","n/a"];

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<Report | null>(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/reports/${id}`).then((r) => r.json())
      .then((d: { report?: Report }) => { if (d.report) { setReport(d.report); setStatus(d.report.status); } });
  }, [id]);

  async function updateStatus(newStatus: string) {
    setSaving(true);
    await fetch(`/api/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setStatus(newStatus);
    setSaving(false);
  }

  function exportMarkdown() {
    if (!report) return;
    const md = [
      `# ${report.title}`,
      ``,
      `**Severity:** ${report.severity.toUpperCase()}${report.cvssScore > 0 ? `  |  **CVSS:** ${report.cvssScore.toFixed(1)}` : ""}`,
      report.cvssVector ? `**Vector:** \`${report.cvssVector}\`` : "",
      `**Status:** ${report.status}`,
      report.platform   ? `**Platform:** ${report.platform}` : "",
      report.programName ? `**Program:** ${report.programName}` : "",
      report.bountyUSD   ? `**Bounty:** $${report.bountyUSD}` : "",
      ``,
      `## Endpoint`,
      `\`${report.endpoint || "—"}\``,
      report.parameter ? `**Parameter:** \`${report.parameter}\`` : "",
      ``,
      `## Proof of Concept`,
      report.poc || "—",
      ``,
      `## Impact`,
      report.impact || "—",
      ``,
      `## Remediation`,
      report.remediation || "—",
      report.httpRequest  ? `\n## HTTP Request\n\`\`\`http\n${report.httpRequest}\n\`\`\`` : "",
      report.httpResponse ? `\n## HTTP Response\n\`\`\`http\n${report.httpResponse}\n\`\`\`` : "",
    ].filter((l) => l !== "").join("\n");

    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${report.title.replace(/\s+/g,"-").toLowerCase()}.md`;
    a.click();
  }

  if (!report) return (
    <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading report…
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/reports" className="mb-4 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300">
        <ChevronLeft className="h-4 w-4" /> Reports
      </Link>

      {/* Header */}
      <div className="mb-6 rounded-xl border border-zinc-700 bg-zinc-900/80 p-6">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">{report.title}</h1>
          <div className="flex gap-2">
            <button onClick={exportMarkdown}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200">
              <Download className="h-4 w-4" /> Export
            </button>
            <Link href={`/reports/${id}/edit`}
              className="flex items-center gap-1.5 rounded-lg bg-tide px-3 py-1.5 text-sm font-semibold text-abyss-900">
              <Edit2 className="h-4 w-4" /> Edit
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded border px-2.5 py-0.5 text-xs font-bold uppercase", SEV_COLOR[report.severity] ?? SEV_COLOR.info)}>
            {report.severity}
          </span>
          {report.cvssScore > 0 && (
            <span className="font-mono text-sm font-bold text-zinc-300">CVSS {report.cvssScore.toFixed(1)}</span>
          )}
          {report.platform && <span className="text-sm text-zinc-500">{report.platform}</span>}
          {report.programName && <span className="text-sm text-zinc-500">· {report.programName}</span>}
          {report.bountyUSD != null && (
            <span className="rounded bg-tide/10 px-2 py-0.5 font-mono text-sm font-semibold text-tide">${report.bountyUSD}</span>
          )}
        </div>

        {/* Status changer */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">Status:</span>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => updateStatus(s)} disabled={saving}
              className={cn("rounded-full px-3 py-1 text-xs capitalize transition",
                status === s ? "bg-zinc-700 text-zinc-100 font-semibold" : "text-zinc-500 hover:text-zinc-300")}>
              {s}
            </button>
          ))}
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />}
        </div>

        {report.target && (
          <div className="mt-3 flex items-center gap-1.5 text-sm">
            <Globe className="h-4 w-4 text-zinc-500" />
            <Link href={`/targets/${report.target.id}`} className="text-tide hover:underline">
              {report.target.domain}
            </Link>
          </div>
        )}

        {report.cvssVector && (
          <div className="mt-3">
            <div className="text-xs text-zinc-500 mb-1">CVSS 3.1 Vector</div>
            <code className="font-mono text-xs text-zinc-400">{report.cvssVector}</code>
          </div>
        )}
      </div>

      {/* Body sections */}
      <div className="space-y-4">
        <Section title="Endpoint">
          <code className="block font-mono text-sm text-zinc-300">{report.endpoint || "—"}</code>
          {report.parameter && <p className="mt-1 text-sm text-zinc-400">Parameter: <code className="font-mono">{report.parameter}</code></p>}
        </Section>

        {report.poc && <Section title="Proof of Concept"><Pre>{report.poc}</Pre></Section>}
        {report.impact && <Section title="Impact"><p className="text-sm text-zinc-300 whitespace-pre-wrap">{report.impact}</p></Section>}
        {report.remediation && <Section title="Remediation"><p className="text-sm text-zinc-300 whitespace-pre-wrap">{report.remediation}</p></Section>}

        {report.httpRequest && (
          <Section title="HTTP Request">
            <Pre>{report.httpRequest}</Pre>
          </Section>
        )}
        {report.httpResponse && (
          <Section title="HTTP Response">
            <Pre>{report.httpResponse}</Pre>
          </Section>
        )}
      </div>

      <div className="mt-6 text-xs text-zinc-600">
        Created {new Date(report.createdAt).toLocaleString()} · Updated {new Date(report.updatedAt).toLocaleString()}
        {report.submittedAt && ` · Submitted ${new Date(report.submittedAt).toLocaleString()}`}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</h2>
      {children}
    </div>
  );
}

function Pre({ children }: { children: string }) {
  return (
    <pre className="overflow-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs text-zinc-300 whitespace-pre-wrap">
      {children}
    </pre>
  );
}
