import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { ScanExperience } from "@/components/console/scan-experience";
import { AiAnalyst } from "@/components/console/ai-analyst";
import { getCurrentUser } from "@/lib/auth";
import { getLatestScan, getRecentScans, type ScanResult } from "@/lib/queries";

function insightFrom(scan: ScanResult | null): string {
  if (!scan) return "Run your first scan to see your security posture analysed in real time.";
  const top = scan.findings.find((f) => f.severity !== "good");
  if (!top) return `${scan.target} graded ${scan.grade} (${scan.score}/100) with no significant header weaknesses. Solid posture.`;
  return `${scan.target} graded ${scan.grade} (${scan.score}/100). Top priority: "${top.title}" — ${top.detail} I'd fix that first.`;
}

export default async function ConsoleOverview() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/console");

  const [latest, recent] = await Promise.all([getLatestScan(user.id), getRecentScans(user.id)]);
  const insight = insightFrom(latest);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="c-rise">
        <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>VaultOcean Console · {user.handle}</p>
        <h1 className="mt-1 text-[28px] font-medium tracking-tight sm:text-[32px]">
          {latest
            ? <>Your surface, <span className="c-grad-text">measured.</span></>
            : <>Map your surface in <span className="c-grad-text">one scan.</span></>}
        </h1>
        <p className="mt-2 max-w-2xl text-[15px]" style={{ color: "var(--c-muted)" }}>
          Enter any domain. VaultOcean resolves its DNS, discovers assets from certificate-transparency logs, and grades
          its live security headers and CSP — real analysis, no guesswork.
        </p>
      </header>

      <ScanExperience initial={latest} />

      {recent.length > 0 && (
        <section className="c-card c-rise p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: "var(--c-muted)" }} />
            <p className="text-[15px] font-medium">Recent scans</p>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {recent.map((s) => (
              <div key={s.id} className="flex items-center gap-4 py-3" style={{ borderColor: "var(--c-border)" }}>
                <span className="font-mono text-[14px]">{s.target}</span>
                <span className="c-chip ml-auto">{s.grade} · {s.score}</span>
                <span className="text-[12px]" style={{ color: "var(--c-faint)" }}>
                  {new Date(s.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <AiAnalyst insight={insight} context={latest ? JSON.stringify({ target: latest.target, grade: latest.grade, score: latest.score, findings: latest.findings.slice(0, 8) }) : undefined} />
    </div>
  );
}
