import type { Metadata } from "next";
import Link from "next/link";
import { Check, Lock, Trophy, Flame, ArrowUpRight, ArrowRight } from "lucide-react";
import { Fathoms } from "@/components/ui";
import { getChallengesByCategory, getProfileByHandle } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Lab — Vault Ocean",
  description: "Hands-on CTF challenges across web, crypto, forensics and more. Crack flags, earn Fathoms.",
};

const DIFF_STYLE: Record<string, string> = {
  easy:   "text-green-400 border-green-400/30",
  medium: "text-yellow-400 border-yellow-400/30",
  hard:   "text-orange-400 border-orange-400/30",
  insane: "text-red-400 border-red-400/30",
};

const CAT_LABEL: Record<string, string> = {
  web:       "Web",
  crypto:    "Crypto",
  forensics: "Forensics",
  reversing: "Reversing",
  pwn:       "Binary / pwn",
  osint:     "OSINT",
};

export default async function LabPage() {
  const user = await getCurrentUser();
  const [groups, profile] = await Promise.all([
    getChallengesByCategory(user?.id ?? null),
    user ? getProfileByHandle(user.handle) : Promise.resolve(null),
  ]);

  const allActive = groups.flatMap((g) => g.items).filter((c) => c.active);
  const solvedCount = allActive.filter((c) => c.solved).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Lab</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Hands-on challenges — download real artifacts, exploit live targets, submit the flag.
            Every solve earns Fathoms and feeds your streak.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/arena/leaderboard"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
          >
            <Trophy className="h-4 w-4" />
            Leaderboard
          </Link>
        </div>
      </div>

      {/* Streak/progress strip */}
      {user && profile ? (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[12px]">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            <span className="font-mono font-medium text-zinc-200">{profile.streakDays}d</span>
            <span className="text-zinc-600">streak</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-zinc-500">
            <span className="font-mono font-medium text-tide">{solvedCount}</span>
            <span>of {allActive.length} solved</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-zinc-500">
            <Fathoms value={profile.fathoms} />
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <p className="text-xs text-zinc-500">{allActive.length} challenges available</p>
          <Link
            href="/login"
            className="flex items-center gap-1.5 font-mono text-xs text-tide transition-colors hover:text-tide/80"
          >
            Sign in to record solves <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Challenge categories */}
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.category}>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {CAT_LABEL[group.category] ?? group.category}
              </h2>
              <span className="h-px flex-1 bg-zinc-800" />
              <span className="font-mono text-[11px] text-zinc-700">{group.items.length}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((c) =>
                c.active ? (
                  <Link
                    key={c.slug}
                    href={`/arena/${c.slug}`}
                    className={cn(
                      "group flex h-full flex-col rounded-xl border bg-zinc-900/60 p-5 transition hover:border-zinc-700",
                      c.solved ? "border-tide/25 bg-zinc-900/80" : "border-zinc-800"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                        DIFF_STYLE[c.difficulty]
                      )}>
                        {c.difficulty}
                      </span>
                      {c.solved ? (
                        <span className="flex items-center gap-1 font-mono text-[11px] text-tide">
                          <Check className="h-3.5 w-3.5" /> solved
                        </span>
                      ) : (
                        <Fathoms value={c.fathoms} />
                      )}
                    </div>
                    <p className="mt-4 flex items-center gap-1.5 text-base font-semibold leading-snug text-zinc-200 transition-colors group-hover:text-tide">
                      {c.title}
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-tide" />
                    </p>
                    <p className="mt-2 flex-1 line-clamp-2 text-xs leading-relaxed text-zinc-600">
                      {c.prompt}
                    </p>
                    <p className="mt-4 font-mono text-[11px] text-zinc-700">
                      {c.solves.toLocaleString()} solve{c.solves !== 1 ? "s" : ""}
                    </p>
                  </Link>
                ) : (
                  <div
                    key={c.slug}
                    className="flex h-full flex-col rounded-xl border border-zinc-800/40 bg-zinc-900/30 p-5 opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                        DIFF_STYLE[c.difficulty]
                      )}>
                        {c.difficulty}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-600">
                        <Lock className="h-3.5 w-3.5" /> soon
                      </span>
                    </div>
                    <p className="mt-4 text-base font-semibold leading-snug text-zinc-500">
                      {c.title}
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-700">
                      {c.prompt}
                    </p>
                  </div>
                )
              )}
            </div>
          </section>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-700 p-10 text-center">
          <p className="text-sm text-zinc-500">Challenges loading — check back soon.</p>
        </div>
      )}
    </div>
  );
}
