import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { FileText, Plus, ArrowLeft } from "lucide-react";

export default async function DocumentTypesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { slug } = await params;

  const company = await db.company.findUnique({
    where: { slug },
  });

  if (!company) redirect("/docx/no-access");

  const companyUser = await db.companyUser.findUnique({
    where: { companyId_userId: { companyId: company.id, userId: user.id } },
    include: { role: true },
  });

  if (!companyUser) redirect("/docx/no-access");

  const isAdmin = companyUser.role.level <= 1;

  if (!isAdmin) redirect(`/docx/${slug}/dashboard`);

  const documentTypes = await db.documentType.findMany({
    where: { companyId: company.id },
    include: {
      storageBackend: { select: { name: true } },
      _count: { select: { batches: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/docx/${slug}/dashboard`}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="h-4 w-4 text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Document Types</h1>
            <p className="mt-1 text-sm text-zinc-400">{company.displayName}</p>
          </div>
        </div>

        <Link
          href={`/docx/${slug}/document-types/create`}
          className="flex items-center gap-2 rounded-lg bg-tide px-4 py-2 text-sm font-semibold text-black transition hover:bg-tide/90"
        >
          <Plus className="h-4 w-4" />
          New Document Type
        </Link>
      </div>

      {/* Document Types Grid */}
      {documentTypes.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-zinc-700" />
          <h3 className="text-lg font-semibold text-zinc-100">
            No Document Types Yet
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            Create your first document type to get started.
          </p>
          <Link
            href={`/docx/${slug}/document-types/create`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-tide px-4 py-2 text-sm font-semibold text-black transition hover:bg-tide/90"
          >
            <Plus className="h-4 w-4" />
            Create Document Type
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documentTypes.map((docType) => (
            <Link
              key={docType.id}
              href={`/docx/${slug}/document-types/${docType.slug}`}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 group-hover:bg-zinc-700">
                  <FileText className="h-5 w-5 text-zinc-400" />
                </div>
              </div>

              <h3 className="font-semibold text-zinc-100">{docType.name}</h3>
              <p className="mt-1 text-xs text-zinc-600 line-clamp-2">
                {docType.description || "No description"}
              </p>

              <div className="mt-4 space-y-1 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
                <div>
                  Storage: <span className="text-zinc-400">
                    {docType.storageBackend?.name || "Default"}
                  </span>
                </div>
                <div>
                  Batches: <span className="text-zinc-400">{docType._count.batches}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
