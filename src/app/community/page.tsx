import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageSquare, GitPullRequest, BookOpen, Flag, Star } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getLeaderboard, getWriteups } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Community",
  description: "The Vault Ocean community — people, contributions, and signal.",
};

const DISCUSSION_TOPICS = [
  {
    title: "What's your go-to tool for subdomain enumeration in 2026?",
    author: "0x595",
    replies: 14,
    category: "Recon",
    age: "2 hours ago",
    hot: true,
  },
  {
    title: "Writeup: Chained IDOR + Broken Object-Level Auth to mass account export",
    author: "nulptr",
    replies: 8,
    category: "Web",
    age: "5 hours ago",
    hot: true,
  },
  {
    title: "Best way to automate CSP header testing in a CI pipeline?",
    author: "jadegrey",
    replies: 6,
    category: "Defence",
    age: "1 day ago",
    hot: false,
  },
  {
    title: "Anyone else seeing the JWT alg:none bypass still alive in wild in 2026?",
    author: "veinfall",
    replies: 19,
    category: "Crypto",
    age: "2 days ago",
    hot: false,
  },
  {
    title: "Sharing my PentX extension for GraphQL introspection enumeration",
    author: "spectre_null",
    replies: 11,
    category: "Arsenal",
    age: "3 days ago",
    hot: false,
  },
];

const CONTRIBUTIONS = [
  { user: "0x595",      action: "merged a PR into PentX",              earn: "+100ƒ", icon: GitPullRequest, age: "1 day ago"   },
  { user: "nulptr",     action: "published a Field writeup",            earn: "+50ƒ",  icon: BookOpen,       age: "2 days ago"  },
  { user: "jadegrey",   action: "solved Abyssal Overflow",              earn: "+500ƒ", icon: Flag,           age: "4 days ago"  },
  { user: "spectre_null", action: "opened a good-first-issue on CSPy",  earn: "+0ƒ",  icon: Star,           age: "5 days ago"  },
  { user: "veinfall",   action: "published a writeup on JWT confusion", earn: "+50ƒ",  icon: BookOpen,       age: "1 week ago"  },
];

export default async function CommunityPage() {
  const [leaderboard, writeups] = await Promise.all([getLeaderboard(5), getWriteups()]);
  const recent = writeups.slice(0, 3);

  return (
    <>
      <PageHeader
        marker="community"
        title="The people are the platform"
        description="Discuss findings, review contributions, and earn reputation tied to real work — not vanity points."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

        {/* Main column */}
        <div className="space-y-10">

          {/* Discussions */}
          <section>
            <div className="mb-5 flex items-center justify-between">
              <p className="label-mono">Discussions</p>
              <Link href="/workspace" className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-secondary transition-colors hover:text-tide">
                Start a thread <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {DISCUSSION_TOPICS.map((d) => (
                <div key={d.title} className="card card-hover p-4">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-ink-primary">{d.title}</p>
                        {d.hot && (
                          <span className="rounded-full border border-orange-400/30 bg-orange-400/8 px-2 py-0.5 font-mono text-[9px] uppercase text-orange-400">
                            hot
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3">
                        <span className="font-mono text-[11px] text-tide">{d.author}</span>
                        <span className="rounded border border-hair px-1.5 py-0.5 font-mono text-[9px] uppercase text-ink-muted">
                          {d.category}
                        </span>
                        <span className="font-mono text-[11px] text-ink-faint">{d.replies} replies · {d.age}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-tide/15 bg-tide/5 p-4">
              <p className="font-mono text-xs text-tide">Threaded discussion coming soon</p>
              <p className="mt-1 text-sm text-ink-secondary">
                Full discussion threads are in development. For now, publish your writeup in{" "}
                <Link href="/workspace" className="text-tide hover:underline">Draft</Link> and the community signals from there.
              </p>
            </div>
          </section>

          {/* Recent contributions */}
          <section>
            <p className="label-mono mb-5">Recent contributions</p>
            <div className="space-y-2">
              {CONTRIBUTIONS.map((c, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-hair bg-abyss-800/30 px-4 py-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-abyss-600/60">
                    <c.icon className="h-3.5 w-3.5 text-tide" />
                  </div>
                  <p className="flex-1 text-sm text-ink-secondary">
                    <span className="font-mono text-tide">{c.user}</span>{" "}
                    {c.action}
                  </p>
                  <span className="font-mono text-sm text-tide">{c.earn}</span>
                  <span className="hidden font-mono text-[10px] text-ink-faint sm:block">{c.age}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Latest writeups */}
          {recent.length > 0 && (
            <section>
              <div className="mb-5 flex items-center justify-between">
                <p className="label-mono">Latest from the field</p>
                <Link href="/writeups" className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-secondary transition-colors hover:text-tide">
                  All writeups <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div>
                {recent.map((w) => (
                  <Link key={w.slug} href={`/writeups/${w.slug}`} className="index-row group items-center">
                    <span className="flex-1 font-display text-lg text-ink-primary transition-colors group-hover:text-tide">
                      {w.title}
                    </span>
                    <span className="font-mono text-[10px] text-ink-faint">{w.readMinutes}m</span>
                  </Link>
                ))}
                <div className="border-t border-hair" />
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">

          {/* Leaderboard */}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="label-mono">Top divers</p>
              <Link href="/arena/leaderboard" className="font-mono text-[10px] text-ink-secondary transition-colors hover:text-tide">
                Full board →
              </Link>
            </div>
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((entry, i) => (
                  <Link key={entry.handle} href={`/profile/${entry.handle}`} className="flex items-center gap-3 transition-opacity hover:opacity-80">
                    <span className="w-4 text-right font-mono text-xs text-ink-faint">{i + 1}</span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-abyss-600 font-mono text-[9px] uppercase text-tide">
                      {entry.handle.slice(0, 2)}
                    </div>
                    <span className="flex-1 font-mono text-sm text-ink-primary">{entry.handle}</span>
                    <span className="font-mono text-sm text-tide">{entry.fathoms.toLocaleString()}ƒ</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-secondary">No members yet. Be the first.</p>
            )}
            <div className="mt-4 border-t border-hair pt-4">
              <Link href="/login" className="btn-tide w-full justify-center text-sm">
                Join and claim a rank <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* How reputation works */}
          <div className="card p-5">
            <p className="label-mono mb-4">How reputation works</p>
            <div className="space-y-3">
              {[
                { action: "Read a writeup",    earn: "+25ƒ" },
                { action: "Crack a CTF flag",  earn: "+50–500ƒ" },
                { action: "Publish a draft",   earn: "+50ƒ" },
                { action: "Merge a PR",        earn: "+100ƒ" },
              ].map((r) => (
                <div key={r.action} className="flex items-center justify-between">
                  <span className="text-sm text-ink-secondary">{r.action}</span>
                  <span className="font-mono text-sm text-tide">{r.earn}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
