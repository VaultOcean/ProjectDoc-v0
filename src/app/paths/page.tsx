import type { Metadata } from "next";
import Link from "next/link";
import { Lock, BookOpen, Flag, Wrench, ArrowRight, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Paths",
  description: "Structured learning paths from first recon to advanced exploitation.",
};

type Step = { title: string; type: "read" | "solve" | "build" | "tool"; earn: string; locked?: boolean };
type Path = {
  id: string;
  name: string;
  desc: string;
  difficulty: string;
  steps: Step[];
  totalFathoms: string;
  color: string;
  icon: typeof BookOpen;
};

const PATHS: Path[] = [
  {
    id: "web-security",
    name: "Web Security",
    desc: "From HTTP fundamentals to chaining SSRF → RCE. Covers the OWASP Top 10 with real writeups and live challenges.",
    difficulty: "Beginner → Advanced",
    totalFathoms: "1,200ƒ",
    color: "text-tide",
    icon: BookOpen,
    steps: [
      { title: "Read: IDOR to full account takeover via UUIDv1", type: "read", earn: "+25ƒ" },
      { title: "Solve: Leaky Cookie — httpOnly attribute", type: "solve", earn: "+50ƒ" },
      { title: "Read: Stored XSS via Markdown image onerror", type: "read", earn: "+25ƒ" },
      { title: "Solve: Ghost in the Params — live IDOR exploit", type: "solve", earn: "+150ƒ" },
      { title: "Read: Blind SSRF reaching cloud metadata", type: "read", earn: "+25ƒ" },
      { title: "Tool: Run PentX against a test domain", type: "tool", earn: "+0ƒ" },
      { title: "Write: Document a web vulnerability you found", type: "build", earn: "+50ƒ", locked: true },
      { title: "Solve: Advanced web challenge (coming soon)", type: "solve", earn: "+300ƒ", locked: true },
    ],
  },
  {
    id: "cryptography",
    name: "Cryptography",
    desc: "Classical ciphers to modern algorithm confusion attacks. Understand why cryptographic primitives fail in practice.",
    difficulty: "Beginner → Hard",
    totalFathoms: "900ƒ",
    color: "text-hop",
    icon: Flag,
    steps: [
      { title: "Read: JWT alg confusion — RS256 to HS256 forgery", type: "read", earn: "+25ƒ" },
      { title: "Solve: Spin Cycle — ROT13 cipher", type: "solve", earn: "+50ƒ" },
      { title: "Solve: Intercepted — base64 encoding", type: "solve", earn: "+75ƒ" },
      { title: "Solve: Evidence Dump — hex forensics", type: "solve", earn: "+75ƒ" },
      { title: "Write: Explain a cipher or crypto vulnerability", type: "build", earn: "+50ƒ", locked: true },
      { title: "Solve: RSA Twins — shared prime factor attack", type: "solve", earn: "+250ƒ", locked: true },
    ],
  },
  {
    id: "recon-osint",
    name: "Recon & OSINT",
    desc: "Passive footprinting, subdomain enumeration, certificate transparency logs, and social engineering surface mapping.",
    difficulty: "Beginner → Medium",
    totalFathoms: "700ƒ",
    color: "text-blue-400",
    icon: Wrench,
    steps: [
      { title: "Read: IDOR in Private Program API", type: "read", earn: "+25ƒ" },
      { title: "Tool: Scan a domain with PentX — inspect the output", type: "tool", earn: "+0ƒ" },
      { title: "Read: Blind SSRF reaching cloud metadata via PDF renderer", type: "read", earn: "+25ƒ" },
      { title: "Solve: Ghost in the Params — API enumeration", type: "solve", earn: "+150ƒ" },
      { title: "Write: Document a subdomain enumeration technique", type: "build", earn: "+50ƒ", locked: true },
      { title: "Solve: OSINT challenge (coming soon)", type: "solve", earn: "+250ƒ", locked: true },
    ],
  },
  {
    id: "binary-pwn",
    name: "Binary Exploitation",
    desc: "Stack-based overflows, ret2libc, format strings. Covers both 32-bit and 64-bit targets with real artifacts.",
    difficulty: "Hard → Insane",
    totalFathoms: "1,500ƒ",
    color: "text-purple-400",
    icon: Flag,
    steps: [
      { title: "Read: Memory safety fundamentals (coming soon)", type: "read", earn: "+25ƒ", locked: true },
      { title: "Solve: Flat Earth — packed binary reversal", type: "solve", earn: "+300ƒ", locked: true },
      { title: "Solve: Abyssal Overflow — ret2libc exploit", type: "solve", earn: "+500ƒ", locked: true },
      { title: "Write: Write a pwn challenge walkthrough", type: "build", earn: "+50ƒ", locked: true },
    ],
  },
];

const TYPE_COLOR = {
  read:  "text-tide bg-tide/10",
  solve: "text-hop bg-hop/10",
  build: "text-yellow-400 bg-yellow-400/10",
  tool:  "text-blue-400 bg-blue-400/10",
};

const TYPE_LABEL = { read: "Field", solve: "Lab", build: "Draft", tool: "Arsenal" };

export default function PathsPage() {
  return (
    <>
      <PageHeader
        marker="paths"
        title="Go deeper, in order"
        description="Structured tracks from first port scan to advanced exploitation. Each step unlocks the next, every completion feeds your streak."
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {[
          { v: "4", k: "learning paths" },
          { v: "32+", k: "steps total" },
          { v: "5,300ƒ", k: "fathoms earnable" },
        ].map((s) => (
          <div key={s.k} className="card p-4 text-center">
            <p className="display text-3xl text-tide">{s.v}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted">{s.k}</p>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        {PATHS.map((path) => (
          <div key={path.id} className="card overflow-hidden">
            {/* Path header */}
            <div className="border-b border-hair px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <path.icon className={`h-4 w-4 ${path.color}`} />
                    <h2 className={`font-display text-xl font-medium ${path.color}`}>{path.name}</h2>
                    <span className="rounded-full border border-hair px-2.5 py-0.5 font-mono text-[10px] text-ink-muted">
                      {path.difficulty}
                    </span>
                  </div>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-secondary">{path.desc}</p>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-lg font-semibold ${path.color}`}>{path.totalFathoms}</p>
                  <p className="font-mono text-[10px] text-ink-muted">total earnable</p>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="divide-y divide-hair">
              {path.steps.map((step, i) => (
                <div key={i} className={`flex items-center gap-4 px-6 py-4 ${step.locked ? "opacity-50" : ""}`}>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                    {step.locked
                      ? <Lock className="h-3.5 w-3.5 text-ink-faint" />
                      : <CheckCircle className="h-3.5 w-3.5 text-hair" />}
                  </div>
                  <span className={`hidden shrink-0 rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider sm:block ${TYPE_COLOR[step.type]}`}>
                    {TYPE_LABEL[step.type]}
                  </span>
                  <p className="flex-1 text-sm text-ink-primary">{step.title}</p>
                  <span className="font-mono text-sm text-tide">{step.earn}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-hair px-6 py-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-secondary transition-colors hover:text-tide"
              >
                Start this path <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-tide/20 bg-tide/5 p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-tide">Progress tracking — coming soon</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          Path progress will be stored on your Depth profile so you can pick up exactly where you left off.
          Completing a path will unlock a permanent profile badge and a rank bonus.
        </p>
      </div>
    </>
  );
}
