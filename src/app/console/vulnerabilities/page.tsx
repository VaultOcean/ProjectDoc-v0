import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getAllScans } from "@/lib/queries";
import { deriveVulns } from "@/lib/derive";

const SEV: Record<string, string> = { critical: "#ff6470", high: "#ff9f43", medium: "#ffd166", low: "#9aa7b8" };

export default async function VulnerabilitiesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/console/vulnerabilities");
  const scans = await getAllScans(user.id);
  const { vulns, counts } = deriveVulns(scans);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="c-rise">
        <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>Vulnerabilities</p>
        <h1 className="mt-1 text-[28px] font-medium tracking-tight sm:text-[32px]">
          Risk, <span className="c-grad-text">prioritised.</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px]" style={{ color: "var(--c-muted)" }}>
          Every weakness found across your scans, ranked worst-first — each with a concrete fix.
        </p>
      </header>

      {vulns.length === 0 ? (
        <div className="c-card c-rise flex flex-col items-start gap-3 p-10">
          <ShieldAlert className="h-6 w-6" style={{ color: "var(--c-accent)" }} />
          <p className="text-[15px]" style={{ color: "var(--c-muted)" }}>No findings yet — run a scan to populate this queue.</p>
          <Link href="/console" className="c-btn c-btn-accent">Run a scan</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(["critical", "high", "medium", "low"] as const).map((s) => (
              <div key={s} className="c-card c-rise p-5">
                <p className="text-[12px] capitalize" style={{ color: "var(--c-muted)" }}>{s}</p>
                <p className="mt-1.5 text-[28px] font-medium leading-none" style={{ color: SEV[s] }}>{counts[s]}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {vulns.map((v) => (
              <div key={v.key} className="c-card c-rise p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                    style={{ background: SEV[v.severity] + "22", color: SEV[v.severity] }}>
                    {v.severity}
                  </span>
                  <p className="text-[15px] font-medium">{v.title}</p>
                  <span className="ml-auto font-mono text-[12px]" style={{ color: "var(--c-faint)" }}>{v.target}</span>
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--c-muted)" }}>{v.detail}</p>
                {v.fix && (
                  <code className="mt-2.5 block overflow-x-auto rounded-md px-3 py-2 text-[12px]"
                    style={{ background: "var(--c-surface-2)", color: "var(--c-accent)" }}>
                    {v.fix}
                  </code>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
