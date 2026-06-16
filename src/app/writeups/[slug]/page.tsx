import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock, Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SeverityBadge } from "@/components/ui";
import { MarkRead } from "@/components/mark-read";
import { ReadingProgress } from "@/components/reading-progress";
import { WriteupLike, WriteupBookmark, WriteupComments } from "@/components/writeup-interactions";
import { getWriteupBySlug, getRelatedWriteups } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const w = await getWriteupBySlug(slug);
  return {
    title: w?.title ?? "Writeup",
    description: w?.summary,
  };
}

export default async function WriteupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [w, user] = await Promise.all([getWriteupBySlug(slug), getCurrentUser()]);
  if (!w) notFound();

  const related = await getRelatedWriteups(w.category, w.slug);
  const initials = w.author.slice(0, 2).toUpperCase();

  return (
    <>
      <ReadingProgress />

      <article className="py-14 sm:py-20">

        {/* Back */}
        <Link
          href="/writeups"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-muted transition-colors hover:text-tide"
        >
          <ArrowLeft className="h-3 w-3" />
          Field
        </Link>

        {/* Article column */}
        <div className="mx-auto mt-10 max-w-2xl">

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <SeverityBadge severity={w.severity} />
            <span className="pill">{w.category}</span>
            <div className="ml-auto flex items-center gap-3 font-mono text-[11px] text-ink-faint">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {w.readMinutes} min read
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {w.date}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="mt-6 font-display text-3xl font-medium leading-tight tracking-tight text-ink-primary sm:text-4xl">
            {w.title}
          </h1>

          {/* Author */}
          <div className="mt-7 flex items-center gap-3 border-b border-hair pb-7">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hair bg-abyss-600 font-mono text-[11px] uppercase text-tide">
              {initials}
            </div>
            <div>
              <p className="font-mono text-xs font-medium text-ink-primary">{w.author}</p>
              <p className="mt-0.5 font-mono text-[10px] text-ink-faint">
                security researcher · vault ocean
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="mt-8">
            <p className="text-base font-medium leading-relaxed text-ink-primary sm:text-lg">
              {w.summary}
            </p>
            {w.body ? (
              <div className="md mt-6">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{w.body}</ReactMarkdown>
              </div>
            ) : null}
          </div>

          {/* Like + bookmark + read */}
          <div className="mt-14 border-t border-hair pt-8">
            <div className="flex items-center gap-3">
              <WriteupLike slug={w.slug} loggedIn={!!user} />
              <WriteupBookmark slug={w.slug} loggedIn={!!user} />
              <div className="flex-1">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                  You read it — record it
                </p>
                <MarkRead slug={w.slug} loggedIn={!!user} />
                <p className="mt-2 font-mono text-[11px] text-ink-faint">
                  Reading earns <span className="text-tide">+25ƒ</span> and keeps your streak alive.
                </p>
              </div>
            </div>
          </div>

          {/* Comments */}
          <WriteupComments
            slug={w.slug}
            loggedIn={!!user}
            userHandle={user?.handle}
          />

          {/* Author card */}
          <div className="mt-8 flex items-center gap-4 rounded-xl border border-hair bg-abyss-800/40 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-hover bg-abyss-600 font-mono text-sm uppercase text-tide">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                Written by
              </p>
              <p className="mt-1 font-mono text-sm font-medium text-ink-primary">{w.author}</p>
              <p className="mt-0.5 text-sm text-ink-muted">
                Security researcher · Vault Ocean contributor
              </p>
            </div>
          </div>
        </div>

        {/* Related writeups */}
        {related.length > 0 && (
          <div className="mx-auto mt-20 max-w-2xl">
            <div className="mb-6 flex items-center gap-4">
              <p className="overline">Related</p>
              <span className="h-px flex-1 bg-hair" />
              <Link
                href="/writeups"
                className="font-mono text-[10px] text-ink-muted transition-colors hover:text-tide"
              >
                All writeups
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/writeups/${r.slug}`}
                  className="card card-hover group flex flex-col gap-3 p-4"
                >
                  <SeverityBadge severity={r.severity} />
                  <p className="font-display text-sm leading-snug text-ink-primary transition-colors group-hover:text-tide">
                    {r.title}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="font-mono text-[10px] text-ink-faint">
                      {r.readMinutes} min
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-ink-faint transition-all group-hover:text-tide" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </>
  );
}
