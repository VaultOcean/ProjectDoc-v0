import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArrowLeft } from "lucide-react";

export default async function CreateBatchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { slug } = await params;

  const company = await db.company.findUnique({ where: { slug } });
  if (!company) redirect("/docx/no-access");

  const companyUser = await db.companyUser.findUnique({
    where: { companyId_userId: { companyId: company.id, userId: user.id } },
    include: { role: true },
  });

  if (!companyUser) redirect("/docx/no-access");

  // Get document types
  const docTypes = await db.documentType.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
  });

  // Get storage backends
  const backends = await db.storageBackend.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href={`/docx/${slug}/dashboard`}
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition"
        >
          <ArrowLeft className="h-4 w-4 text-zinc-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Create Upload Batch</h1>
          <p className="mt-1 text-sm text-zinc-400">{company.displayName}</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
        <form
          action={async (formData) => {
            "use server";
            const name = formData.get("name") as string;
            const docTypeId = formData.get("documentTypeId") as string;
            const storageBackendId = formData.get("storageBackendId") as string;

            if (!name || !docTypeId || !storageBackendId) {
              return;
            }

            const batch = await db.uploadBatch.create({
              data: {
                companyId: company.id,
                documentTypeId: docTypeId,
                storageBackendId: storageBackendId,
                name,
                createdByUserId: companyUser.id,
                status: "uploading",
              },
            });

            redirect(`/docx/${slug}/batches/${batch.id}`);
          }}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-semibold text-zinc-100 mb-2">
              Batch Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g., May 2025 Invoices, Q2 Receipts"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-zinc-500">
              A friendly name for this batch of documents
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-100 mb-2">
              Document Type
            </label>
            <select
              name="documentTypeId"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 focus:border-zinc-500 focus:outline-none"
            >
              <option value="">Select a document type...</option>
              {docTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-500">
              The template defining fields to extract
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-100 mb-2">
              Storage Backend
            </label>
            <select
              name="storageBackendId"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 focus:border-zinc-500 focus:outline-none"
            >
              <option value="">Select where to store extracted data...</option>
              {backends.map((backend) => (
                <option key={backend.id} value={backend.id}>
                  {backend.name} ({backend.type})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-500">
              Where extracted data will be stored
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-tide px-4 py-2.5 font-semibold text-black transition hover:bg-tide/90"
            >
              Create Batch & Upload Files
            </button>
            <Link
              href={`/docx/${slug}/dashboard`}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-center font-semibold text-zinc-100 transition hover:bg-zinc-800"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Info */}
      <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <h3 className="font-semibold text-zinc-100 mb-2">How it works:</h3>
        <ol className="space-y-2 text-sm text-zinc-400">
          <li>1. Create a batch with a name and document type</li>
          <li>2. Upload documents (PDFs, images, etc.)</li>
          <li>3. See a preview of each document</li>
          <li>4. Manually select and map fields from the preview</li>
          <li>5. Mark fields as encrypted or PII if needed</li>
          <li>6. Export extracted data to your storage backend</li>
        </ol>
      </div>
    </div>
  );
}
