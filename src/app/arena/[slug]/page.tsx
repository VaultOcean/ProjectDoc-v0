import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Download, Check, Globe, Flag, Lock } from "lucide-react";
import { Fathoms } from "@/components/ui";
import { FlagForm } from "@/components/flag-form";
import { HintList } from "@/components/hint-list";
import { getChallengeWithState, getChallengesWithState } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

const DIFF: Record<string, string> = {
  easy:   "text-sev-low   border-sev-low/30   bg-sev-low/5",
  medium: "text-sev-medium border-sev-medium/30 bg-sev-medium/5",
  hard:   "text-sev-high  border-sev-high/30  bg-sev-high/5",
  insane: "text-sev-critical border-sev-critical/30 bg-sev-critical/5",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getChallengeWithState(slug, null);
  return { title: c ? `${c.title} — Lab` : "Challenge" };
}

export default async function ChallengePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const [c, allChallenges] = await Promise.all([
    getChallengeWithState(slug, user?.id ?? null),
    getChallengesWithState(user?.id ?? null),
  ]);
  if (!c || !c.active) notFound();

  const nextChallenge = allChallenges.find(
    (ch) => ch.active && !ch.solved && ch.slug !== slug
  ) ?? null;

  return (
    <article className="py-10 sm:py-14">

      {/* Back */}
      <Link
        href="/arena"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted transition-colors hover:text-hop"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Lab
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">

        {/* ── Left: challenge body ── */}
        <div>
          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(
              "rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider",
              DIFF[c.difficulty]
            )}>
              {c.difficulty}
            </span>
            <span className="pill">{c.category}</span>
            {c.kind === "web" && (
              <span className="pill text-hop">
                <Globe className="h-3 w-3" /> live target
              </span>
            )}
            <span className="font-mono text-xs text-ink-muted">
              {c.solves.toLocaleString()} solves
            </span>
          </div>

          {/* Title */}
          <h1 className="display display-lg mt-5 text-ink-primary">{c.title}</h1>

          {/* Solved banner */}
          {c.solved && (
            <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-hop/30 bg-hop/8 px-4 py-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-hop/15">
                <Check className="h-4 w-4 text-hop" />
              </div>
              <div>
                <p className="font-mono text-sm font-medium text-hop">Flag captured</p>
                <p className="font-mono text-[11px] text-ink-muted">You solved this challenge.</p>
              </div>
              {nextChallenge && (
                <Link
                  href={`/arena/${nextChallenge.slug}`}
                  className="ml-auto inline-flex items-center gap-1.5 font-mono text-xs text-tide transition-colors hover:text-tide-bright"
                >
                  Next challenge <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}

          {/* Description */}
          <div className="mt-6 max-w-2xl space-y-3 text-[15px] leading-[1.75] text-ink-secondary">
            <p>{c.description}</p>
          </div>

          {/* Files */}
          {c.files.length > 0 && (
            <section className="mt-8">
              <p className="label-mono mb-3">Files</p>
              <div className="flex flex-wrap gap-3">
                {c.files.map((f) => (
                  <a
                    key={f.url}
                    href={f.url}
                    download
                    className="inline-flex items-center gap-2 rounded-lg border border-hair bg-abyss-800 px-4 py-2.5 font-mono text-sm text-ink-primary transition-colors hover:border-hop/40 hover:text-hop"
                  >
                    <Download className="h-4 w-4" /> {f.name}
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Live target */}
          {c.kind === "web" && (
            <section className="mt-8">
              <p className="label-mono mb-3">Live target</p>
              <code className="block rounded-xl border border-hop/25 bg-abyss-900 px-4 py-3 font-mono text-[13px] text-hop">
                {(process.env.NEXT_PUBLIC_SITE_URL ?? "")}/api/ctf/staff/1337
              </code>
              <p className="mt-2 font-mono text-[11px] text-ink-muted">
                This endpoint is live and intentionally vulnerable — exploit it.
              </p>
            </section>
          )}

          {/* Hints */}
          <section className="mt-8">
            <p className="label-mono mb-3">Hints</p>
            <HintList hints={c.hints} />
          </section>
        </div>

        {/* ── Right: flag submission panel ── */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-hair bg-abyss-800/60 p-6">

            {/* Reward */}
            <div className="mb-5 flex items-center justify-between">
              <p className="label-mono">Reward</p>
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-hop" />
                <Fathoms value={c.fathoms} />
              </div>
            </div>

            {c.solved ? (
              <div className="rounded-xl border border-hop/25 bg-hop/8 p-4 text-center">
                <Check className="mx-auto h-5 w-5 text-hop" />
                <p className="mt-2 font-mono text-sm text-hop">Solved</p>
                {nextChallenge ? (
                  <Link
                    href={`/arena/${nextChallenge.slug}`}
                    className="btn-ghost mt-4 w-full justify-center text-xs"
                  >
                    Next challenge <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <Link
                    href="/arena"
                    className="btn-ghost mt-4 w-full justify-center text-xs"
                  >
                    Back to Lab <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            ) : user ? (
              <>
                <p className="mb-3 font-mono text-[11px] text-ink-muted">
                  Submit the flag to claim your Fathoms.
                </p>
                <FlagForm slug={c.slug} solved={c.solved} />
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-hair p-4 text-center">
                <Lock className="mx-auto h-5 w-5 text-ink-faint" />
                <p className="mt-2 font-mono text-sm text-ink-secondary">
                  Sign in to submit
                </p>
                <Link
                  href={`/login?next=/arena/${c.slug}`}
                  className="btn-tide mt-4 w-full justify-center text-xs"
                >
                  Sign in
                </Link>
              </div>
            )}

            {/* Divider */}
            <div className="my-5 border-t border-hair" />

            {/* Category + difficulty reference */}
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between text-ink-muted">
                <span>Category</span>
                <span className="text-ink-secondary">{c.category}</span>
              </div>
              <div className="flex items-center justify-between text-ink-muted">
                <span>Difficulty</span>
                <span className={cn(DIFF[c.difficulty]?.split(" ")[0])}>{c.difficulty}</span>
              </div>
              <div className="flex items-center justify-between text-ink-muted">
                <span>Solves</span>
                <span className="text-ink-secondary">{c.solves.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
