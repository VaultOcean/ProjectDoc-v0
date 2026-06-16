import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FileText, Loader2, AlertTriangle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DocxWorkspace } from "@/components/docx-workspace";

export const metadata: Metadata = {
  title: "Docx Workspace",
};

export default async function DocxSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const session = await db.docxSession.findUnique({
    where: { id },
    include: { fields: { orderBy: { position: "asc" } } },
  });

  if (!session || session.userId !== user.id) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-6">
          <AlertTriangle className="h-8 w-8 text-red-400" />
          <p className="mt-2 text-red-300">Document not found</p>
          <Link href="/docx" className="mt-4 inline-flex text-sm text-tide hover:underline">
            Back to documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/docx"
          className="flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-400 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to documents
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800">
              <FileText className="h-6 w-6 text-zinc-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">{session.name}</h1>
              <p className="mt-1 text-sm text-zinc-500">{session.fileName}</p>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-3">
            {session.status === "extracting" && (
              <div className="flex items-center gap-2 rounded-lg border border-blue-900/40 bg-blue-950/20 px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                <span className="font-mono text-xs text-blue-300">Processing…</span>
              </div>
            )}
            {session.status === "error" && (
              <div className="flex items-center gap-2 rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="font-mono text-xs text-red-300">Error</span>
              </div>
            )}
            {session.status === "ready" && (
              <div className="flex items-center gap-2 rounded-lg border border-green-900/40 bg-green-950/20 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                <span className="font-mono text-xs text-green-300">Ready</span>
              </div>
            )}

            <span className="flex items-center gap-1.5 text-xs text-zinc-600">
              <span className="h-px w-4 bg-zinc-800" />
              {session.fields.length} field{session.fields.length !== 1 ? "s" : ""}
              {session.wordCount > 0 && (
                <>
                  <span className="mx-1.5">·</span>
                  {session.wordCount.toLocaleString()} words
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Error state */}
      {session.status === "error" && session.errorMsg && (
        <div className="mb-6 rounded-xl border border-red-900/40 bg-red-950/20 p-4">
          <p className="font-mono text-sm text-red-300">{session.errorMsg}</p>
        </div>
      )}

      {/* Extracting state */}
      {session.status === "extracting" && (
        <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-6 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-400" />
          <p className="font-mono text-sm text-blue-300">
            Extracting fields from your document…
          </p>
        </div>
      )}

      {/* Ready state: show workspace */}
      {session.status === "ready" && (
        <DocxWorkspace
          session={{
            id: session.id,
            name: session.name,
            rawText: session.rawText,
            status: session.status,
          }}
          initialFields={session.fields}
        />
      )}

      {/* Uploaded state: waiting for extraction */}
      {session.status === "uploaded" && (
        <div className="rounded-xl border border-dashed border-zinc-700 p-12 text-center">
          <p className="text-sm text-zinc-500">
            Ready to extract. Refresh the page or wait a moment.
          </p>
        </div>
      )}
    </div>
  );
}
