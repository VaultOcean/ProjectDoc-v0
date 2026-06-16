import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { MODULES } from "@/lib/console-data";

const PREVIEW: Record<string, string> = {
  surface: "An interactive map of every internet-facing surface, scored and ranked by real exposure — the ocean view, zoomable down to a single port.",
  assets: "Your asset universe: every domain, host, API, cloud resource and identity, with the relationships between them drawn as living currents.",
  vulnerabilities: "A risk-driven queue — not a CVE dump. Findings are prioritised by exploitability and blast radius, with one-click context.",
  csp: "A modern Content-Security-Policy explorer: see exactly what each directive allows, what it blocks, and what an attacker could still do.",
  headers: "Security-header compliance at a glance — graded, explained in plain language, with copy-paste fixes.",
  cloud: "Beautiful cloud topology maps across AWS, GCP and Azure, with misconfigurations surfaced where they actually matter.",
  threats: "Global threat intelligence, contextual to your stack — only the storms heading your way.",
  reports: "Executive-grade, board-ready reports generated in one click — the kind you'd actually present.",
  analyst: "Your always-on AI Security Analyst — ask anything, get prioritised, explained, actionable answers.",
};

export default async function ConsoleModule({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const meta = MODULES.find((m) => m.slug === module);
  if (!meta || module === "overview") notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/console" className="c-navitem mb-8 inline-flex !px-2 text-[13px]">
        <ArrowLeft className="h-4 w-4" /> Overview
      </Link>

      <div className="c-card c-rise relative overflow-hidden p-10 sm:p-14">
        <div className="c-float absolute -right-10 -top-10 h-48 w-48 rounded-full" style={{ background: "radial-gradient(circle, var(--c-bg-glow-1), transparent 70%)" }} />
        <span className="c-chip"><Sparkles className="h-3 w-3" /> in design</span>
        <h1 className="mt-5 text-[34px] font-medium tracking-tight">{meta.label}</h1>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
          {PREVIEW[module] ?? "A premium module, coming soon."}
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/console" className="c-btn c-btn-accent">Back to command center</Link>
          <span className="c-btn" style={{ color: "var(--c-muted)" }}>Notify me when it ships</span>
        </div>
      </div>
    </div>
  );
}
