import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { getPublicBlog } from "@/lib/queries";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  return { title: `${handle} · blog`, description: `Security writing by ${handle}` };
}

export default async function BlogPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const blog = await getPublicBlog(handle);
  if (!blog) notFound();

  return (
    <div className="py-14 sm:py-20">

      {/* Author header */}
      <Reveal>
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-hover bg-abyss-600 font-mono text-xl uppercase text-tide">
            {blog.handle.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <h1 className="display text-3xl text-ink-primary">{blog.displayName}</h1>
            <p className="mt-1 font-mono text-sm text-ink-muted">
              vaultocean.com/u/{blog.handle} ·{" "}
              <Link href={`/profile/${blog.handle}`} className="text-tide hover:underline">
                depth profile →
              </Link>
            </p>
            {blog.bio && (
              <p className="mt-3 max-w-lg leading-relaxed text-ink-secondary">{blog.bio}</p>
            )}
          </div>
        </div>
      </Reveal>

      {/* Post list */}
      <div className="mt-14">
        <Reveal>
          <div className="mb-6 flex items-center gap-4">
            <p className="label-mono">Posts</p>
            <span className="h-px flex-1 bg-hair" />
            <span className="font-mono text-[11px] text-ink-faint">{blog.docs.length}</span>
          </div>
        </Reveal>

        {blog.docs.length === 0 ? (
          <Reveal>
            <div className="card p-8 text-center">
              <p className="text-ink-muted">No public posts yet.</p>
            </div>
          </Reveal>
        ) : (
          <div className="space-y-3">
            {blog.docs.map((d, i) => (
              <Reveal key={d.slug} delay={i * 40}>
                <Link
                  href={`/u/${blog.handle}/${d.slug}`}
                  className="group flex flex-col gap-2 rounded-xl border border-hair bg-abyss-800/40 px-5 py-5 transition-colors hover:border-hover hover:bg-abyss-700/40"
                >
                  <h2 className="font-display text-xl leading-snug text-ink-primary transition-colors group-hover:text-tide">
                    {d.title || "Untitled"}
                  </h2>
                  {d.summary && (
                    <p className="line-clamp-2 text-sm leading-relaxed text-ink-secondary">
                      {d.summary}
                    </p>
                  )}
                  <div className="mt-1 flex items-center justify-between">
                    <p className="font-mono text-[11px] text-ink-faint">
                      {new Date(d.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })} · {d.readMinutes} min read
                    </p>
                    <ArrowRight className="h-4 w-4 text-ink-faint opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-tide" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
