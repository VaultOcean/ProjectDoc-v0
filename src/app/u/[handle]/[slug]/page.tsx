import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { ReadingProgress } from "@/components/reading-progress";
import { getPublicDoc } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}): Promise<Metadata> {
  const { handle, slug } = await params;
  const data = await getPublicDoc(handle, slug);
  return { title: data ? data.doc.title : "Post", description: data?.doc.summary ?? undefined };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle, slug } = await params;
  const data = await getPublicDoc(handle, slug);
  if (!data) notFound();
  const { doc, author } = data;

  return (
    <>
      <ReadingProgress />
      <article className="mx-auto max-w-2xl py-12 sm:py-16">

        {/* Back nav */}
        <Link
          href={`/u/${author.handle}`}
          className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted transition-colors hover:text-tide"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {author.displayName}
        </Link>

        {/* Title */}
        <h1 className="display display-lg mt-6 text-ink-primary">{doc.title}</h1>

        {/* Summary lead */}
        {doc.summary && (
          <p className="mt-4 text-xl leading-relaxed text-ink-secondary">{doc.summary}</p>
        )}

        {/* Author + meta */}
        <div className="mt-6 flex items-center gap-3 border-b border-hair pb-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-abyss-600 font-mono text-[10px] uppercase text-tide">
            {author.handle.slice(0, 2)}
          </div>
          <div>
            <Link
              href={`/u/${author.handle}`}
              className="font-mono text-sm font-medium text-ink-primary transition-colors hover:text-tide"
            >
              {author.displayName}
            </Link>
            <p className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-ink-muted">
              <Clock className="h-3 w-3" />
              {doc.readMinutes} min read
              <span className="text-ink-faint">·</span>
              {new Date(doc.updatedAt).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="mt-8">
          <Markdown content={doc.content} />
        </div>

        {/* Author footer */}
        <div className="mt-16 flex items-center gap-4 rounded-xl border border-hair bg-abyss-800/40 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-abyss-600 font-mono text-sm uppercase text-tide">
            {author.handle.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="font-mono text-sm font-medium text-ink-primary">{author.displayName}</p>
            <Link
              href={`/u/${author.handle}`}
              className="font-mono text-[11px] text-ink-muted transition-colors hover:text-tide"
            >
              View all posts →
            </Link>
          </div>
        </div>

      </article>
    </>
  );
}
