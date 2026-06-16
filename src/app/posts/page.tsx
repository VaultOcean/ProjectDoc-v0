import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PenLine, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Posts · Vault Ocean",
  description: "Research posts and findings from the Vault Ocean community.",
};

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export default async function PostsPage() {
  const [posts, user] = await Promise.all([
    db.post.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        slug: true,
        title: true,
        summary: true,
        tags: true,
        readMinutes: true,
        createdAt: true,
        author: { select: { handle: true, displayName: true } },
      },
    }),
    getCurrentUser(),
  ]);

  const parsed = posts.map((p) => ({
    ...p,
    tags: (() => { try { return JSON.parse(p.tags) as string[]; } catch { return [] as string[]; } })(),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Posts</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Research, writeups, and findings from the Vault Ocean community.
          </p>
        </div>
        {user && (
          <Link
            href="/posts/new"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-tide px-4 py-2 font-mono text-xs font-bold text-abyss-900 transition-opacity hover:opacity-90"
          >
            <PenLine className="h-3.5 w-3.5" />
            Write a post
          </Link>
        )}
      </div>

      {parsed.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 p-10 text-center">
          <PenLine className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">No posts yet.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Be the first to share your research, writeup, or finding with the community.
          </p>
          <div className="mt-4 flex justify-center">
            {user ? (
              <Link href="/posts/new" className="inline-flex items-center gap-1.5 rounded-lg bg-tide px-4 py-2 font-mono text-xs font-bold text-abyss-900 hover:opacity-90">
                Write the first post
              </Link>
            ) : (
              <Link href="/login" className="inline-flex items-center gap-1.5 rounded-lg bg-tide px-4 py-2 font-mono text-xs font-bold text-abyss-900 hover:opacity-90">
                Sign in to post
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="mb-4 font-mono text-[11px] text-zinc-600">
            {parsed.length} post{parsed.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {parsed.map((p) => (
              <Link
                key={p.slug}
                href={`/posts/${p.slug}`}
                className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700 sm:flex-row sm:items-start sm:gap-5"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold leading-snug text-zinc-200 transition group-hover:text-tide">
                    {p.title}
                  </h2>
                  {p.summary && (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                      {p.summary}
                    </p>
                  )}
                  {p.tags.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {p.tags.slice(0, 4).map((t) => (
                        <span key={t} className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end sm:gap-1.5">
                  <div className="text-right">
                    <p className="font-mono text-xs font-medium text-zinc-400">
                      {p.author.displayName || `@${p.author.handle}`}
                    </p>
                    <p className="font-mono text-[10px] text-zinc-600">@{p.author.handle}</p>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {p.readMinutes} min
                    </span>
                    <span>{timeAgo(new Date(p.createdAt))}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-tide sm:mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
