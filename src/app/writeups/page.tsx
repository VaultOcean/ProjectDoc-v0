import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { SeverityBadge } from "@/components/ui";
import { getWriteups } from "@/lib/queries";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Field — Vault Ocean",
  description: "Real bug-bounty disclosures and technique breakdowns, distilled from the field.",
};

const CAT_LABELS: Record<string, string> = {
  web:       "Web",
  crypto:    "Crypto",
  forensics: "Forensics",
  reversing: "Reversing",
  pwn:       "Binary",
  osint:     "OSINT",
  misc:      "Misc",
};

export default async function WriteupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const activeCat = sp.cat ?? null;

  const allWriteups = await getWriteups();
  const categories = Array.from(new Set(allWriteups.map((w) => w.category))).filter(Boolean);
  const writeups = activeCat ? allWriteups.filter((w) => w.category === activeCat) : allWriteups;
  const hero = writeups[0] ?? null;
  const rest = writeups.slice(1);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Field</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Real bug-bounty disclosures and technique breakdowns — distilled from the field.
          </p>
        </div>
        <span className="font-mono text-xs text-zinc-600">
          {allWriteups.length} writeup{allWriteups.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          <Link
            href="/writeups"
            className={cn(
              "rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors",
              !activeCat
                ? "border-tide/50 bg-tide/10 text-tide"
                : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
            )}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/writeups?cat=${cat}`}
              className={cn(
                "rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors",
                activeCat === cat
                  ? "border-tide/50 bg-tide/10 text-tide"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              )}
            >
              {CAT_LABELS[cat] ?? cat}
            </Link>
          ))}
        </div>
      )}

      {/* Hero writeup */}
      {hero && (
        <Link
          href={`/writeups/${hero.slug}`}
          className="group mb-6 block overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 transition hover:border-zinc-700"
        >
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <SeverityBadge severity={hero.severity} />
              <span className="font-mono text-xs text-zinc-600">{hero.category}</span>
              <span className="ml-auto font-mono text-xs text-zinc-600">
                {hero.readMinutes} min read
              </span>
            </div>
            <h2 className="mt-5 text-lg font-semibold leading-snug text-zinc-100 transition group-hover:text-tide sm:text-xl">
              {hero.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">{hero.summary}</p>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 font-mono text-[9px] uppercase text-tide">
                {hero.author.slice(0, 2)}
              </div>
              <span className="font-mono text-xs text-zinc-500">{hero.author}</span>
              <span className="font-mono text-xs text-zinc-600">· {hero.readMinutes} min read</span>
            </div>
            <div className="mt-4 flex items-center gap-2 font-mono text-sm text-tide">
              Read writeup
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      )}

      {/* Rest — index list */}
      {rest.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              More from the field
            </p>
            <span className="h-px flex-1 bg-zinc-800" />
          </div>
          <div className="divide-y divide-zinc-800">
            {rest.map((w) => (
              <Link
                key={w.slug}
                href={`/writeups/${w.slug}`}
                className="group flex items-center gap-4 py-3 transition"
              >
                <div className="hidden w-20 shrink-0 sm:block">
                  <SeverityBadge severity={w.severity} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 transition group-hover:text-tide truncate">
                    {w.title}
                  </p>
                  <p className="mt-0.5 hidden text-xs text-zinc-600 sm:block">
                    {w.category} · {w.author}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs text-zinc-600">{w.readMinutes}m</span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-700 transition group-hover:text-tide" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {writeups.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-700 p-10 text-center">
          {activeCat ? (
            <>
              <p className="text-sm text-zinc-500">No writeups in this category yet.</p>
              <Link href="/writeups" className="mt-3 inline-flex font-mono text-xs text-tide hover:underline">
                View all writeups
              </Link>
            </>
          ) : (
            <p className="text-sm text-zinc-500">No writeups yet — check back soon.</p>
          )}
        </div>
      )}
    </div>
  );
}
