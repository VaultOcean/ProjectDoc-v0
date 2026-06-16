import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Globe } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import { SubdomainFinder } from "@/components/subdomain-finder";
import { getTools } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Arsenal — Vault Ocean",
  description: "Open security tools — PentX, FILEx, CSPy. Run them, fork them, contribute back.",
};

export default async function ToolsPage() {
  const tools = await getTools();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">Arsenal</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Open security tools — PentX, FILEx, CSPy. Run free, read the source, open a pull request.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

        {/* Built-in: Subdomain Recon */}
        <Link
          href="#recon"
          className="group flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700 scroll-mt-20"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">Recon</h2>
            <span className="rounded-full border border-tide/30 bg-tide/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-tide">
              live
            </span>
          </div>
          <p className="mt-3 flex-1 text-xs leading-relaxed text-zinc-500">
            Subdomain enumeration via certificate transparency logs (crt.sh). Passive-only — no active scanning.
          </p>
          <div className="mt-4 flex flex-wrap gap-1">
            {["subdomain-enum", "osint", "recon", "passive"].map((tag) => (
              <span key={tag} className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-1.5 font-mono text-[11px] text-zinc-600">
            Web · crt.sh
            <Globe className="ml-auto h-4 w-4 transition-colors group-hover:text-tide" />
          </p>
        </Link>

        {tools.map((t) => (
          <Link
            key={t.slug}
            href={`/tools/${t.slug}`}
            className="group flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-200">{t.name}</h2>
              <StatusBadge status={t.status} />
            </div>
            <p className="mt-3 flex-1 text-xs leading-relaxed text-zinc-500">
              {t.detail}
            </p>
            <div className="mt-4 flex flex-wrap gap-1">
              {t.tags.map((tag) => (
                <span key={tag} className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-1.5 font-mono text-[11px] text-zinc-600">
              {t.language}
              <ArrowUpRight className="ml-auto h-4 w-4 transition-colors group-hover:text-tide" />
            </p>
          </Link>
        ))}
      </div>

      {/* Live subdomain finder */}
      <div id="recon" className="mt-10 scroll-mt-20">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Subdomain Recon</h2>
          <span className="h-px flex-1 bg-zinc-800" />
        </div>
        <SubdomainFinder />
      </div>
    </div>
  );
}
