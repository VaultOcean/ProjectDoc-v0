import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Globe, Lock, FileText, ArrowRight, GitGraph, Clock, Hash, Plus } from "lucide-react";
import { NewDocButton } from "@/components/new-doc-button";
import { getCurrentUser } from "@/lib/auth";
import { getUserDocs } from "@/lib/queries";

export const metadata: Metadata = { title: "Notes — Vault Ocean" };

export default async function WorkspacePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/workspace");
  const docs = await getUserDocs(user.id);

  const publicDocs  = docs.filter((d) => d.visibility === "public");
  const privateDocs = docs.filter((d) => d.visibility !== "public");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">

      {/* Header — matches Engagements/Earnings style */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Notes</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Security notes, research drafts, published writeups — linked via{" "}
            <code className="font-mono text-[12px] text-zinc-300">[[wikilinks]]</code> and mapped in the knowledge graph.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/workspace/graph"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
          >
            <GitGraph className="h-4 w-4" />
            Graph
          </Link>
          <NewDocButton />
        </div>
      </div>

      {/* Stats strip */}
      {docs.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[12px] text-zinc-500">
            <FileText className="h-3.5 w-3.5" />
            <span className="text-zinc-300 font-medium">{docs.length}</span> doc{docs.length !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-zinc-500">
            <Globe className="h-3.5 w-3.5" />
            <span className="text-zinc-300 font-medium">{publicDocs.length}</span> published
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-zinc-500">
            <Clock className="h-3.5 w-3.5" />
            Last updated{" "}
            <span className="text-zinc-300 font-medium">
              {new Date(docs[0]?.updatedAt ?? new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
          <Link
            href="/workspace/graph"
            className="ml-auto flex items-center gap-1 text-[12px] text-zinc-600 transition hover:text-tide"
          >
            <Hash className="h-3 w-3" />
            {docs.length} nodes in graph
          </Link>
        </div>
      )}

      {docs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 p-10 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">No notes yet.</p>
          <p className="mt-1 text-sm text-zinc-500">Create your first note or research draft.</p>
          <div className="mt-4 flex justify-center">
            <NewDocButton />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {publicDocs.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Published ({publicDocs.length})
                </h2>
                <Link
                  href={`/u/${user.handle}`}
                  className="flex items-center gap-1 text-xs text-tide transition hover:text-tide/80"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {publicDocs.map((d) => <DocCard key={d.id} doc={d} />)}
              </div>
            </section>
          )}

          {privateDocs.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Private drafts ({privateDocs.length})
                </h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {privateDocs.map((d) => <DocCard key={d.id} doc={d} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function DocCard({
  doc,
}: {
  doc: { id: string; title: string; summary: string | null; slug: string; visibility: string; updatedAt: Date };
}) {
  const isPublic = doc.visibility === "public";
  return (
    <Link
      href={`/workspace/${doc.id}`}
      className="group flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700"
    >
      <div className="flex items-center gap-2">
        <span className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
          isPublic
            ? "border-tide/20 bg-tide/10 text-tide"
            : "border-zinc-700 bg-zinc-800 text-zinc-500"
        }`}>
          {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          {isPublic ? "public" : "private"}
        </span>
        <span className="ml-auto font-mono text-[11px] text-zinc-600">
          {new Date(doc.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
      <p className="text-sm font-medium text-zinc-200 transition group-hover:text-tide">
        {doc.title || "Untitled"}
      </p>
      {doc.summary && (
        <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">{doc.summary}</p>
      )}
    </Link>
  );
}
