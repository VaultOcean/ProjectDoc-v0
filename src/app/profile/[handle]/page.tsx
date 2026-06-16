import type { Metadata } from "next";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { Flame, ArrowRight, Check, BookOpen, Flag, PenLine, Zap } from "lucide-react";
import Link from "next/link";
import { Fathoms } from "@/components/ui";
import { Reveal } from "@/components/reveal";
import { ContributionGraph, ContributionLegend } from "@/components/contribution-graph";
import { FollowStats } from "@/components/follow-button";
import { getProfileByHandle, getProfileRecentSolves, getPublicBlog } from "@/lib/queries";
import { rankFor, RANKS, rankMeta } from "@/lib/progress";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  return { title: `${handle} · Depth profile` };
}

const DIFF_STYLE: Record<string, string> = {
  easy:   "border-sev-low/30   text-sev-low",
  medium: "border-sev-medium/30 text-sev-medium",
  hard:   "border-sev-high/30  text-sev-high",
  insane: "border-sev-critical/30 text-sev-critical",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const [p, recentSolves, blog, me] = await Promise.all([
    getProfileByHandle(handle),
    getProfileRecentSolves(handle, 5),
    getPublicBlog(handle),
    getCurrentUser(),
  ]);
  if (!p) notFound();
  const isOwnProfile = me?.handle === handle;

  const { rank, next, nextAt } = rankFor(p.fathoms);
  const rc = rankMeta(rank);
  const currentRankIdx = RANKS.findIndex((r) => r.name === rank);
  const prevMin = RANKS[currentRankIdx]?.min ?? 0;
  const progress =
    nextAt != null
      ? Math.min(100, Math.round(((p.fathoms - prevMin) / (nextAt - prevMin)) * 100))
      : 100;
  const initials = p.handle.slice(0, 2).toUpperCase();
  const publicDocs = blog?.docs ?? [];

  return (
    <div className="py-14 sm:py-20">

      {/* ── Profile hero ── */}
      <Reveal>
        <div className="flex flex-wrap items-start gap-6">

          {/* Avatar with rank ring */}
          <div className={cn(
            "relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 font-mono text-2xl uppercase",
            rc.ring,
            rc.icon
          )}>
            <span className={rc.text}>{initials}</span>
            {/* Rank pip */}
            <span className={cn(
              "absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-abyss-900 font-mono text-[9px]",
              rc.icon
            )}>
              <span className={rc.text}>{currentRankIdx + 1}</span>
            </span>
          </div>

          {/* Identity */}
          <div className="min-w-0 flex-1">
            <h1 className="display text-3xl text-ink-primary sm:text-4xl">
              {p.displayName}
            </h1>
            <p className="mt-1 font-mono text-sm text-ink-secondary">@{p.handle}</p>
            {p.bio && (
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-secondary">
                {p.bio}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-[11px]">
              <span className={cn("flex items-center gap-1.5 font-medium", rc.text)}>
                <span className={cn("h-2 w-2 rounded-full", rc.bar)} />
                {rank}
              </span>
              <span className="flex items-center gap-1 text-sev-high">
                <Flame className="h-3.5 w-3.5" />
                {p.streakDays}-day streak
              </span>
              <span className="text-ink-muted">
                <Fathoms value={p.fathoms} />
              </span>
              <span className="text-ink-faint">joined {p.joined}</span>
            </div>
            <div className="mt-5">
              <FollowStats handle={handle} isOwnProfile={isOwnProfile} />
            </div>
          </div>

          {/* View blog link */}
          {publicDocs.length > 0 && (
            <Link
              href={`/u/${p.handle}`}
              className="hidden items-center gap-1.5 rounded-lg border border-hair px-4 py-2 font-mono text-xs text-ink-secondary transition-colors hover:border-hover hover:text-tide sm:flex"
            >
              Blog <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </Reveal>

      {/* ── Rank progress card ── */}
      <Reveal delay={40}>
        <div className="card mt-8 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={cn("h-2.5 w-2.5 rounded-full", rc.bar)} />
              <span className={cn("font-mono text-sm font-medium", rc.text)}>{rank}</span>
              {next && (
                <span className="font-mono text-[10px] text-ink-faint">
                  → {next}
                </span>
              )}
            </div>
            <span className="font-mono text-[11px] text-ink-muted">
              {progress}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-abyss-600">
            <div
              className={cn("h-full rounded-full transition-all duration-700", rc.bar)}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-ink-faint">
            <span>{p.fathoms.toLocaleString()}ƒ earned</span>
            {next
              ? <span>{(nextAt! - p.fathoms).toLocaleString()}ƒ to {next}</span>
              : <span>Maximum depth reached</span>
            }
          </div>

          {/* Rank ladder */}
          <div className="mt-5">
            <div className="flex items-center">
              {RANKS.map((r, i) => {
                const reached = p.fathoms >= r.min;
                const isCurrent = r.name === rank;
                const rm = rankMeta(r.name);
                const nextReached = i < RANKS.length - 1 && p.fathoms >= RANKS[i + 1].min;
                return (
                  <Fragment key={r.name}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[9px]",
                        reached ? cn(rm.ring, rm.icon, "border-2") : "border-hair bg-abyss-700/40 text-ink-faint"
                      )}>
                        <span className={reached ? rm.text : ""}>{i + 1}</span>
                      </div>
                      <span className={cn(
                        "hidden font-mono text-[8px] uppercase tracking-wider sm:block",
                        isCurrent ? rc.text : reached ? "text-ink-secondary" : "text-ink-faint"
                      )}>
                        {r.name.slice(0, 4)}
                      </span>
                    </div>
                    {i < RANKS.length - 1 && (
                      <div className={cn(
                        "mx-0.5 mb-5 h-px flex-1",
                        nextReached ? rc.bar : "bg-hair"
                      )} />
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── Stats grid ── */}
      <Reveal delay={60}>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { Icon: BookOpen, value: p.stats.writeupsRead,       label: "Read",         iconCls: "text-blue-400",    bg: "bg-blue-400/10" },
            { Icon: Flag,     value: p.stats.challengesSolved,   label: "Flags solved", iconCls: "text-emerald-400", bg: "bg-emerald-400/10" },
            { Icon: PenLine,  value: p.stats.writeupsPublished,  label: "Published",    iconCls: "text-tide",        bg: "bg-tide/10" },
            { Icon: Zap,      value: p.stats.toolPrsMerged,      label: "Tool PRs",     iconCls: "text-purple-400",  bg: "bg-purple-400/10" },
          ].map((s) => (
            <div key={s.label} className="card p-4 sm:p-5">
              <div className={cn("mb-3 flex h-8 w-8 items-center justify-center rounded-lg", s.bg)}>
                <s.Icon className={cn("h-4 w-4", s.iconCls)} />
              </div>
              <p className="display text-2xl text-ink-primary">{s.value}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ── Activity heatmap ── */}
      <Reveal delay={60}>
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="label-mono">Activity · last 52 weeks</p>
            <ContributionLegend />
          </div>
          <div className="card p-5 sm:p-6">
            <ContributionGraph data={p.contributions} />
          </div>
        </section>
      </Reveal>

      {/* ── Recent solves + Posts ── */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">

        {/* Recent solves */}
        <Reveal delay={40}>
          <section>
            <div className="mb-4 flex items-center gap-3">
              <p className="label-mono">Recent solves</p>
              <span className="h-px flex-1 bg-hair" />
              <Link
                href="/arena"
                className="font-mono text-[10px] text-ink-muted transition-colors hover:text-tide"
              >
                Lab →
              </Link>
            </div>
            {recentSolves.length > 0 ? (
              <div className="space-y-2">
                {recentSolves.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/arena/${s.slug}`}
                    className="group flex items-center gap-3 rounded-xl border border-hair bg-abyss-800/30 px-4 py-3 transition-colors hover:border-hover"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-hop/10">
                      <Check className="h-3.5 w-3.5 text-hop" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs font-medium text-ink-primary transition-colors group-hover:text-tide">
                        {s.title}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-ink-faint">
                        {s.category} · {s.fathoms}ƒ
                      </p>
                    </div>
                    <span className={cn(
                      "shrink-0 rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase",
                      DIFF_STYLE[s.difficulty] ?? "border-hair text-ink-muted"
                    )}>
                      {s.difficulty}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-hair p-6 text-center">
                <p className="font-mono text-sm text-ink-muted">No solves yet.</p>
                <Link
                  href="/arena"
                  className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-tide transition-colors hover:underline"
                >
                  Enter the Lab <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </section>
        </Reveal>

        {/* Published posts */}
        <Reveal delay={60}>
          <section>
            <div className="mb-4 flex items-center gap-3">
              <p className="label-mono">Published posts</p>
              <span className="h-px flex-1 bg-hair" />
              {publicDocs.length > 0 && (
                <Link
                  href={`/u/${p.handle}`}
                  className="font-mono text-[10px] text-ink-muted transition-colors hover:text-tide"
                >
                  Blog →
                </Link>
              )}
            </div>
            {publicDocs.length > 0 ? (
              <div className="space-y-2">
                {publicDocs.slice(0, 5).map((d) => (
                  <Link
                    key={d.slug}
                    href={`/u/${p.handle}/${d.slug}`}
                    className="group flex items-center gap-3 rounded-xl border border-hair bg-abyss-800/30 px-4 py-3 transition-colors hover:border-hover"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-tide/10">
                      <PenLine className="h-3.5 w-3.5 text-tide" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs font-medium text-ink-primary transition-colors group-hover:text-tide">
                        {d.title || "Untitled"}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-ink-faint">
                        {d.readMinutes} min read
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-faint transition-all group-hover:translate-x-0.5 group-hover:text-tide" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-hair p-6 text-center">
                <p className="font-mono text-sm text-ink-muted">Nothing published yet.</p>
                <Link
                  href="/workspace"
                  className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-tide transition-colors hover:underline"
                >
                  Open Draft <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </section>
        </Reveal>
      </div>

    </div>
  );
}
