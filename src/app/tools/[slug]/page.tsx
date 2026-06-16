import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GitPullRequest, ExternalLink, Terminal, Star } from "lucide-react";
import { GithubIcon } from "@/components/brand";
import { StatusBadge } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { getToolBySlug } from "@/lib/queries";
import { ToolScanner } from "@/components/tool-scanner";
import { CspAnalyzer } from "@/components/csp-analyzer";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await getToolBySlug(slug);
  return { title: t?.name ?? "Tool", description: t?.detail };
}

const INSTALL: Record<string, string[]> = {
  pentx: ["npm install -g @vaultocean/pentx", "pentx scan target.com", "pentx report --format json"],
  filex: ["pip install filex", "filex convert input.pdf --out md", "filex merge a.pdf b.pdf --out combined.pdf"],
  cspy:  ["# Install from Chrome Web Store (link above)", "# Open DevTools → CSPy tab on any page", "# Or use the inline analyzer below"],
};

const PRINCIPLES: Record<string, { label: string; body: string }[]> = {
  pentx: [
    { label: "Evidence-grade output", body: "Every finding ships with full request/response bytes and a cURL repro you can paste directly into a report." },
    { label: "SSRF-safe", body: "Internal IP ranges are blocked at the resolver level — it won't turn into a tool against your own infrastructure." },
    { label: "CI-friendly", body: "JSON output, exit codes per severity, and a GitHub Actions workflow in the repo." },
  ],
  filex: [
    { label: "On-premise only", body: "No document ever leaves your machine. Self-hosted Python FastAPI server — no cloud dependency." },
    { label: "Metadata stripping", body: "Automatically redacts author, creation dates, and embedded comments before exporting." },
    { label: "Batch processing", body: "Process entire directories in one command. Parallel workers for large document sets." },
  ],
  cspy: [
    { label: "Real-time audit", body: "Inspects every page you visit as you browse, not just when you remember to run a scan." },
    { label: "Plain-English explanations", body: "Each gap explains what an attacker could actually do — not just which header is missing." },
    { label: "Export-ready", body: "One-click copy of the full CSP report for inclusion in a pentest or bug bounty submission." },
  ],
};

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getToolBySlug(slug);
  if (!t) notFound();

  const installLines = INSTALL[t.slug] ?? [`npm install -g @vaultocean/${t.slug}`, `${t.slug} --help`];
  const principles = PRINCIPLES[t.slug] ?? [
    { label: "Open source", body: "Full transparency — read the code, audit it, trust it." },
    { label: "Self-hostable", body: "Run it on your own infra. No data leaves your machine." },
    { label: "Free, always", body: "No licence fees, no paywalls, no vendor lock-in." },
  ];

  return (
    <div className="py-14 sm:py-20">

      {/* Back */}
      <Reveal>
        <Link href="/tools" className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-muted transition-colors hover:text-tide">
          <ArrowLeft className="h-3 w-3" />
          Arsenal
        </Link>
      </Reveal>

      {/* Hero */}
      <Reveal delay={40}>
        <div className="mt-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status={t.status} />
            <span className="pill">{t.language}</span>
          </div>
          <h1 className="mt-5 font-display text-4xl font-medium tracking-tight text-ink-primary sm:text-5xl">
            {t.name}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-secondary">{t.detail}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={t.repo} target="_blank" rel="noopener noreferrer" className="btn-tide">
              <GithubIcon className="h-4 w-4" />
              View source
            </Link>
            <Link href={`${t.repo}/issues`} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              <GitPullRequest className="h-4 w-4" />
              Open issues
            </Link>
          </div>
        </div>
      </Reveal>

      {/* Capabilities tags */}
      <Reveal delay={60}>
        <div className="mt-14">
          <p className="overline mb-5">Capabilities</p>
          <div className="flex flex-wrap gap-2">
            {t.tags.map((tag) => (
              <span key={tag} className="rounded-lg border border-hair bg-abyss-800/40 px-4 py-2.5 font-mono text-sm text-ink-secondary">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Install + Contribute */}
      <Reveal delay={80}>
        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          <div className="term">
            <div className="term-bar">
              <span className="term-dot bg-[#ff5f57]" />
              <span className="term-dot bg-[#febc2e]" />
              <span className="term-dot bg-[#28c840]" />
              <span className="ml-3 font-mono text-[11px] text-ink-faint">
                <Terminal className="inline h-3 w-3 mr-1" />install
              </span>
            </div>
            <div className="space-y-2 p-5 font-mono text-sm">
              {installLines.map((line, i) => (
                <p key={i} className={line.startsWith("#") ? "text-ink-faint" : "text-ink-secondary"}>
                  {!line.startsWith("#") && <span className="mr-2 text-ink-muted">$</span>}
                  {line}
                </p>
              ))}
              <p className="mt-2 text-ink-muted">$ <span className="caret" /></p>
            </div>
          </div>

          <div className="card flex flex-col p-6">
            <div className="flex items-center gap-2.5">
              <Star className="h-4 w-4 text-tide" />
              <p className="overline">Contribute · earn fathoms</p>
            </div>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-secondary">
              Open issues are labelled{" "}
              <code className="rounded bg-abyss-700 px-1.5 py-0.5 font-mono text-[12px] text-tide">good-first-issue</code>.
              Merge a pull request and earn <span className="font-mono text-tide">+100ƒ</span> — it lands directly on your Depth profile.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`${t.repo}/issues?q=is%3Aopen+label%3Agood-first-issue`}
                target="_blank" rel="noopener noreferrer"
                className="btn-ghost text-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Good first issues
              </Link>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Principles */}
      <Reveal delay={40}>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {principles.map((p) => (
            <div key={p.label} className="rounded-xl border border-hair bg-abyss-800/30 p-5">
              <p className="font-mono text-xs text-tide">{p.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{p.body}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Per-tool interactive section */}
      <Reveal delay={60}>
        {t.slug === "pentx" && <ToolScanner />}
        {t.slug === "cspy" && <CspAnalyzer />}
        {t.slug === "filex" && <FilexInfo />}
      </Reveal>
    </div>
  );
}

function FilexInfo() {
  return (
    <div className="mt-14 space-y-4">
      <p className="overline mb-5">What FILEx does</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { cmd: "filex convert input.pdf --out md", desc: "Converts PDF to clean Markdown — preserves headings, tables, and code blocks. Useful before feeding docs to an LLM." },
          { cmd: "filex merge a.pdf b.pdf --out out.pdf", desc: "Merges multiple PDFs in order. Handles encrypted inputs if you provide the password." },
          { cmd: "filex strip input.pdf --out clean.pdf", desc: "Removes metadata (Author, Creator, GPS, dates) and embedded scripts before sharing externally." },
          { cmd: "filex info input.pdf", desc: "Dumps all metadata fields: author, dates, producer, page count, embedded fonts, and any JavaScript found." },
        ].map((item) => (
          <div key={item.cmd} className="rounded-xl border border-hair bg-abyss-800/30 p-5">
            <code className="block font-mono text-[12px] text-tide mb-3">$ {item.cmd}</code>
            <p className="text-sm leading-relaxed text-ink-secondary">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="card p-5 mt-4">
        <p className="font-mono text-xs text-tide mb-2">Why self-hosted?</p>
        <p className="text-sm leading-relaxed text-ink-secondary">
          Cloud PDF converters — including most SaaS tools — store your documents server-side, sometimes for weeks.
          FILEx runs entirely on your machine or your own infra. No documents leave. Designed for legal teams,
          security researchers, and anyone who cannot afford a third-party data leak.
        </p>
      </div>
    </div>
  );
}
