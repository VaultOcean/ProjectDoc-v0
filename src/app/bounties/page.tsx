import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, DollarSign, Target, Shield, Clock } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Bounties",
  description: "Public bug-bounty program board — scope, reward ranges, and recent disclosures.",
};

const PROGRAMS = [
  {
    name: "Synack Red Team",
    platform: "Synack",
    scope: ["*.synack.com", "api.synack.com", "app.synack.com"],
    maxReward: "$20,000",
    minReward: "$200",
    category: "Web · API · Mobile",
    reports: 312,
    status: "active",
    note: "Invite-only. Requires Synack membership. Pays on triage.",
  },
  {
    name: "HackerOne Platform",
    platform: "HackerOne",
    scope: ["*.hackerone.com", "api.hackerone.com", "hackerone.com/graphql"],
    maxReward: "$25,000",
    minReward: "$500",
    category: "Web · GraphQL · API",
    reports: 1840,
    status: "active",
    note: "High-signal program. GraphQL endpoint has historically paid critical rewards.",
  },
  {
    name: "Cloudflare",
    platform: "HackerOne",
    scope: ["*.cloudflare.com", "api.cloudflare.com", "dash.cloudflare.com"],
    maxReward: "$3,000",
    minReward: "$200",
    category: "Web · API · Infrastructure",
    reports: 2410,
    status: "active",
    note: "Broad scope across their whole product surface. Workers and R2 in scope.",
  },
  {
    name: "GitHub",
    platform: "HackerOne",
    scope: ["github.com", "api.github.com", "*.github.io", "*.github.com"],
    maxReward: "$30,000",
    minReward: "$617",
    category: "Web · API · CI/CD",
    reports: 5600,
    status: "active",
    note: "Actions workflows and third-party integrations often have interesting attack surface.",
  },
  {
    name: "Shopify",
    platform: "HackerOne",
    scope: ["*.myshopify.com", "shopify.com", "partners.shopify.com"],
    maxReward: "$50,000",
    minReward: "$500",
    category: "Web · E-commerce · API",
    reports: 4100,
    status: "active",
    note: "Liquid templates and app bridge create interesting SSRF and XSS surface.",
  },
  {
    name: "Dropbox",
    platform: "HackerOne",
    scope: ["dropbox.com", "api.dropboxapi.com", "content.dropboxapi.com"],
    maxReward: "$32,768",
    minReward: "$216",
    category: "Web · File Storage · API",
    reports: 1900,
    status: "active",
    note: "OAuth flows and shared link handling are historically fruitful attack vectors.",
  },
];

const RECENT_DISCLOSURES = [
  { title: "IDOR exposing private team data via predictable resource IDs", program: "GitHub", severity: "high", reward: "$5,000", age: "3 days ago" },
  { title: "Stored XSS in markdown renderer via crafted image attributes", program: "HackerOne", severity: "critical", reward: "$12,000", age: "1 week ago" },
  { title: "SSRF via webhook URL validation bypass reaching internal services", program: "Shopify", severity: "high", reward: "$8,500", age: "2 weeks ago" },
  { title: "Authentication bypass via JWT algorithm confusion in OAuth flow", program: "Cloudflare", severity: "critical", reward: "$3,000", age: "3 weeks ago" },
  { title: "Path traversal in file upload endpoint leaking adjacent directories", program: "Dropbox", severity: "high", reward: "$2,048", age: "1 month ago" },
];

const SEV = { critical: "text-red-400 bg-red-400/8 border-red-400/30", high: "text-orange-400 bg-orange-400/8 border-orange-400/30" };

export default function BountiesPage() {
  return (
    <>
      <PageHeader
        marker="bounties"
        title="Hunt with signal"
        description="Active public programs with scope, reward ranges, and recent disclosures — one low-noise view of the live market."
      />

      {/* Stats bar */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Target,  v: "6",    k: "active programs" },
          { icon: DollarSign, v: "$50k", k: "top payout" },
          { icon: Shield,  v: "16k+", k: "public reports" },
          { icon: Clock,   v: "Live", k: "status" },
        ].map((s) => (
          <div key={s.k} className="card flex items-center gap-3 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tide/10">
              <s.icon className="h-4 w-4 text-tide" />
            </div>
            <div>
              <p className="font-mono text-base font-semibold text-ink-primary">{s.v}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">{s.k}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Program grid */}
      <div className="mb-12 grid gap-4 lg:grid-cols-2">
        {PROGRAMS.map((p) => (
          <div key={p.name} className="card-hover card flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg text-ink-primary">{p.name}</h2>
                  <span className="rounded-full border border-tide/25 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-tide">
                    {p.status}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-ink-muted">via {p.platform} · {p.category}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold text-tide">{p.maxReward}</p>
                <p className="font-mono text-[10px] text-ink-muted">max reward</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.scope.map((s) => (
                <code key={s} className="rounded border border-hair bg-abyss-900/60 px-2 py-0.5 font-mono text-[11px] text-ink-secondary">
                  {s}
                </code>
              ))}
            </div>

            <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-secondary">{p.note}</p>

            <div className="mt-4 flex items-center justify-between border-t border-hair pt-4">
              <span className="font-mono text-[11px] text-ink-muted">
                {p.reports.toLocaleString()} public reports · from {p.minReward}
              </span>
              <ArrowUpRight className="h-4 w-4 text-ink-faint" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent disclosures */}
      <section className="card p-6">
        <div className="mb-5 flex items-center justify-between">
          <p className="label-mono">Recent disclosures</p>
          <span className="font-mono text-[10px] text-ink-muted">publicly disclosed only</span>
        </div>
        <div>
          {RECENT_DISCLOSURES.map((d, i) => (
            <div
              key={i}
              className="index-row group items-start gap-4"
            >
              <span className={`hidden shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase sm:block ${SEV[d.severity as keyof typeof SEV]}`}>
                {d.severity}
              </span>
              <p className="flex-1 text-sm text-ink-primary">{d.title}</p>
              <span className="shrink-0 font-mono text-sm text-tide">{d.reward}</span>
              <span className="hidden shrink-0 font-mono text-[11px] text-ink-faint sm:block">{d.age}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 rounded-xl border border-tide/20 bg-tide/5 p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-tide">Coming next</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          Saved searches, scope-match alerts, and a personal bounty tracker are in the pipeline.
          Submit a program you want to see listed via a{" "}
          <Link href="/workspace" className="text-tide hover:underline">Draft post</Link>.
        </p>
      </div>
    </>
  );
}
