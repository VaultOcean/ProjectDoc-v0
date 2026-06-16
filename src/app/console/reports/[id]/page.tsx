import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getScanReport } from "@/lib/queries";

const SEV: Record<string, string> = { critical: "#ff6470", high: "#ff9f43", medium: "#ffd166", low: "#9aa7b8", good: "#5dd0a0", info: "var(--c-accent)" };
function gradeColor(g: string) {
  if (g.startsWith("A")) return "#5dd0a0";
  if (g === "B") return "var(--c-accent)";
  if (g === "C") return "#ffd166";
  if (g === "D") return "#ff9f43";
  return "#ff6470";
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/console/reports");
  const s = await getScanReport(user.id, id);
  if (!s) notFound();

  const issues = s.findings.filter((f) => f.severity !== "good");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/console/reports" className="c-navitem mb-2 inline-flex !px-2 text-[13px]">
        <ArrowLeft className="h-4 w-4" /> Reports
      </Link>

      <div className="c-card c-rise p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>Security assessment</p>
            <h1 className="mt-1 text-[28px] font-medium tracking-tight">{s.target}</h1>
            <p className="mt-1 text-[12px]" style={{ color: "var(--c-faint)" }}>
              {new Date(s.createdAt).toLocaleString()} · VaultOcean Console
            </p>
          </div>
          <div className="text-right">
            <p className="text-[44px] font-medium leading-none" style={{ color: gradeColor(s.grade) }}>{s.grade}</p>
            <p className="text-[12px]" style={{ color: "var(--c-faint)" }}>{s.score}/100</p>
          </div>
        </div>

        <p className="mt-6 text-[15px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
          {s.target} scored <strong style={{ color: "var(--c-text)" }}>{s.grade} ({s.score}/100)</strong> on its live
          security posture. We found <strong style={{ color: "var(--c-text)" }}>{issues.length}</strong> issue
          {issues.length === 1 ? "" : "s"} across HTTP security headers and CSP, and discovered{" "}
          <strong style={{ color: "var(--c-text)" }}>{s.subdomains.length}</strong> public asset
          {s.subdomains.length === 1 ? "" : "s"}.
        </p>
      </div>

      <section className="c-card c-rise p-6">
        <p className="mb-4 text-[15px] font-medium">Findings</p>
        <div className="space-y-3">
          {issues.length === 0 && <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>No weaknesses found.</p>}
          {issues.map((f) => (
            <div key={f.id} className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: SEV[f.severity] }} />
              <div>
                <p className="text-[14px] font-medium">{f.title} <span className="text-[11px] uppercase" style={{ color: SEV[f.severity] }}>· {f.severity}</span></p>
                <p className="mt-0.5 text-[13px] leading-relaxed" style={{ color: "var(--c-muted)" }}>{f.detail}</p>
                {f.fix && <code className="mt-1.5 block overflow-x-auto rounded-md px-2 py-1 text-[11px]" style={{ background: "var(--c-surface-2)", color: "var(--c-accent)" }}>{f.fix}</code>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="c-card c-rise p-6">
          <p className="mb-3 text-[15px] font-medium">Headers present</p>
          {s.present.length === 0 ? <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>None.</p> : (
            <div className="flex flex-wrap gap-1.5">{s.present.map((h) => <span key={h.name} className="c-chip">{h.name}</span>)}</div>
          )}
        </div>
        <div className="c-card c-rise p-6">
          <p className="mb-3 text-[15px] font-medium">DNS</p>
          {(["a", "aaaa", "mx", "ns"] as const).map((k) => s.dns[k].length > 0 && (
            <p key={k} className="mb-1 text-[12.5px]" style={{ color: "var(--c-muted)" }}>
              <span className="font-mono uppercase" style={{ color: "var(--c-faint)" }}>{k}</span> {s.dns[k].join(", ")}
            </p>
          ))}
        </div>
      </section>

      {s.subdomains.length > 0 && (
        <section className="c-card c-rise p-6">
          <p className="mb-3 text-[15px] font-medium">Discovered assets ({s.subdomains.length})</p>
          <div className="flex flex-wrap gap-1.5">{s.subdomains.map((d) => <span key={d} className="c-chip">{d}</span>)}</div>
        </section>
      )}
    </div>
  );
}
