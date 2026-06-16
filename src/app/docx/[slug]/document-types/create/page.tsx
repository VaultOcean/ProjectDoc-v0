import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArrowLeft } from "lucide-react";

export default async function CreateDocumentTypePage({
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

  const storageBackends = await db.storageBackend.findMany({
    where: { companyId: company.id },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href={`/docx/${slug}/document-types`}
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition"
        >
          <ArrowLeft className="h-4 w-4 text-zinc-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Create Document Type
          </h1>
          <p className="mt-1 text-sm text-zinc-400">{company.displayName}</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
        <form
          action={async (formData) => {
            "use server";
            const name = formData.get("name") as string;
            const description = formData.get("description") as string;
            const storageBackendId = formData.get("storageBackendId") as string;

            if (!name) {
              return;
            }

            await db.documentType.create({
              data: {
                companyId: company.id,
                name,
                slug: name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "_")
                  .replace(/^_|_$/g, ""),
                description,
                fieldDefs: JSON.stringify([]),
                storageBackendId: storageBackendId || undefined,
              },
            });

            redirect(`/docx/${slug}/document-types`);
          }}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-semibold text-zinc-100 mb-2">
              Document Type Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g., Invoice, Purchase Order, Receipt"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 placeholder-zinc-600 transition focus:border-zinc-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Used to identify this document type in batches
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-100 mb-2">
              Description
            </label>
            <textarea
              name="description"
              placeholder="e.g., Invoices from suppliers with vendor details and line items"
              rows={3}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 placeholder-zinc-600 transition focus:border-zinc-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Optional. Helps your team understand what this document type is for.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-100 mb-2">
              Storage Backend
            </label>
            <select
              name="storageBackendId"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 transition focus:border-zinc-500 focus:outline-none"
            >
              <option value="">Default</option>
              {storageBackends.map((backend) => (
                <option key={backend.id} value={backend.id}>
                  {backend.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-500">
              Where extracted data will be stored. Use default if not configured.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-tide px-4 py-2.5 font-semibold text-black transition hover:bg-tide/90"
            >
              Create Document Type
            </button>
            <Link
              href={`/docx/${slug}/document-types`}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-center font-semibold text-zinc-100 transition hover:bg-zinc-800"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
