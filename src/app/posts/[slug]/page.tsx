import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, Tag, Pencil, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ReadingProgress } from "@/components/reading-progress";
import { WriteupLike, WriteupBookmark, WriteupComments } from "@/components/writeup-interactions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.post.findUnique({ where: { slug }, select: { title: true, summary: true } });
  return { title: post?.title ?? "Post", description: post?.summary };
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, user] = await Promise.all([
    db.post.findUnique({
      where: { slug },
      include: { author: { select: { handle: true, displayName: true, fathoms: true } } },
    }),
    getCurrentUser(),
  ]);

  if (!post) notFound();
  if (post.status !== "published" && post.userId !== user?.id) notFound();

  const tags: string[] = (() => { try { return JSON.parse(post.tags); } catch { return []; } })();
  const isOwner = post.userId === user?.id;
  const initials = post.author.handle.slice(0, 2).toUpperCase();

  return (
    <>
      <ReadingProgress />

      <article className="mx-auto max-w-2xl py-14 sm:py-20">

        {/* Back */}
        <Link
          href="/posts"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-muted transition-colors hover:text-tide"
        >
          <ArrowLeft className="h-3 w-3" />
          Posts
        </Link>

        {/* Owner controls */}
        {isOwner && (
          <div className="mt-4 flex items-center gap-3">
            <span className="rounded-full border border-tide/30 bg-tide/10 px-2.5 py-0.5 font-mono text-[10px] text-tide">
              {post.status}
            </span>
            <Link
              href={`/posts/${slug}/edit`}
              className="flex items-center gap-1 font-mono text-[11px] text-ink-muted transition-colors hover:text-tide"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Link>
          </div>
        )}

        {/* Title */}
        <h1 className="mt-6 font-display text-3xl font-medium leading-tight tracking-tight text-ink-primary sm:text-4xl">
          {post.title}
        </h1>

        {/* Author row */}
        <div className="mt-7 flex items-center gap-3 border-b border-hair pb-7">
          <Link href={`/profile/${post.author.handle}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hair bg-abyss-600 font-mono text-[11px] uppercase text-tide">
              {initials}
            </div>
          </Link>
          <div className="flex-1">
            <Link href={`/profile/${post.author.handle}`} className="font-mono text-xs font-medium text-ink-primary hover:text-tide transition-colors">
              {post.author.displayName || `@${post.author.handle}`}
            </Link>
            <p className="mt-0.5 font-mono text-[10px] text-ink-faint">@{post.author.handle}</p>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px] text-ink-faint">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.readMinutes} min read
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(new Date(post.createdAt))}
            </span>
          </div>
        </div>

        {/* Summary */}
        {post.summary && (
          <p className="mt-8 text-base font-medium leading-relaxed text-ink-primary sm:text-lg">
            {post.summary}
          </p>
        )}

        {/* Body */}
        {post.body ? (
          <div
            className="md mt-6"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        ) : (
          <p className="mt-6 text-ink-faint italic">No content yet.</p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-hair pt-6">
            <Tag className="h-3.5 w-3.5 text-ink-faint" />
            {tags.map((t) => (
              <span key={t} className="rounded-full border border-hair px-2.5 py-0.5 font-mono text-[11px] text-ink-secondary">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Like + bookmark */}
        <div className="mt-10 border-t border-hair pt-8">
          <div className="flex items-center gap-3">
            <WriteupLike slug={`post:${post.slug}`} loggedIn={!!user} />
            <WriteupBookmark slug={`post:${post.slug}`} loggedIn={!!user} />
          </div>
        </div>

        {/* Comments */}
        <WriteupComments
          slug={`post:${post.slug}`}
          loggedIn={!!user}
          userHandle={user?.handle}
        />

        {/* Author card */}
        <div className="mt-10 flex items-center gap-4 rounded-xl border border-hair bg-abyss-800/40 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-hover bg-abyss-600 font-mono text-sm uppercase text-tide">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">Written by</p>
            <Link href={`/profile/${post.author.handle}`} className="mt-1 block font-mono text-sm font-medium text-ink-primary hover:text-tide transition-colors">
              {post.author.displayName || `@${post.author.handle}`}
            </Link>
            <p className="mt-0.5 text-sm text-ink-muted">{post.author.fathoms.toLocaleString()}ƒ depth</p>
          </div>
          <Link
            href={`/profile/${post.author.handle}`}
            className="ml-auto flex-shrink-0 rounded-lg border border-hair px-3 py-1.5 font-mono text-xs text-ink-muted transition-colors hover:border-tide/40 hover:text-tide"
          >
            View profile
          </Link>
        </div>
      </article>
    </>
  );
}
