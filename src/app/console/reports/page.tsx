import Link from "next/link";
import { redirect } from "next/navigation";
import { FileBarChart, ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getAllScans } from "@/lib/queries";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/console/reports");
  const scans = await getAllScans(user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="c-rise">
        <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>Reports</p>
        <h1 className="mt-1 text-[28px] font-medium tracking-tight sm:text-[32px]">
          Board-ready <span className="c-grad-text">reports.</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px]" style={{ color: "var(--c-muted)" }}>
          Every scan becomes a clean, presentable report. Open one to view or print it.
        </p>
      </header>

      {scans.length === 0 ? (
        <div className="c-card c-rise flex flex-col items-start gap-3 p-10">
          <FileBarChart className="h-6 w-6" style={{ color: "var(--c-accent)" }} />
          <p className="text-[15px]" style={{ color: "var(--c-muted)" }}>No reports yet — run a scan to generate one.</p>
          <Link href="/console" className="c-btn c-btn-accent">Run a scan</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map((s) => (
            <Link key={s.id} href={`/console/reports/${s.id}`} className="c-card c-rise c-hover flex items-center gap-4 p-5">
              <div>
                <p className="text-[15px] font-medium">{s.target}</p>
                <p className="mt-0.5 text-[12px]" style={{ color: "var(--c-faint)" }}>
                  {new Date(s.createdAt).toLocaleString()} · {s.findings.filter((f) => f.severity !== "good").length} findings
                </p>
              </div>
              <span className="c-chip ml-auto">{s.grade} · {s.score}</span>
              <ArrowRight className="h-4 w-4" style={{ color: "var(--c-muted)" }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
