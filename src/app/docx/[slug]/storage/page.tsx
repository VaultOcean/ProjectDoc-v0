import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArrowLeft, Plus, Database, Check, X } from "lucide-react";

export default async function StorageConfigPage({
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

  const backends = await db.storageBackend.findMany({
    where: { companyId: company.id },
    include: { _count: { select: { documentTypes: true } } },
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
            <h1 className="text-2xl font-bold text-zinc-100">
              Storage Configuration
            </h1>
            <p className="mt-1 text-sm text-zinc-400">{company.displayName}</p>
          </div>
        </div>

        <Link
          href={`/docx/${slug}/storage/new`}
          className="flex items-center gap-2 rounded-lg bg-tide px-4 py-2 text-sm font-semibold text-black transition hover:bg-tide/90"
        >
          <Plus className="h-4 w-4" />
          Add Backend
        </Link>
      </div>

      {/* Overview Card */}
      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
        <h2 className="font-semibold text-zinc-100">About Storage Backends</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Configure where Docx should store extracted document data. Each document type
          can use a different backend (database, cloud storage, etc.). Your admin must
          approve and test the connection before it can be used.
        </p>
      </div>

      {/* Backends List */}
      {backends.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <Database className="mx-auto mb-4 h-12 w-12 text-zinc-700" />
          <h3 className="text-lg font-semibold text-zinc-100">
            No Storage Backends
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            Add your first storage backend to configure where data is stored.
          </p>
          <Link
            href={`/docx/${slug}/storage/new`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-tide px-4 py-2 text-sm font-semibold text-black transition hover:bg-tide/90"
          >
            <Plus className="h-4 w-4" />
            Add Backend
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="divide-y divide-zinc-800">
            {backends.map((backend) => (
              <div
                key={backend.id}
                className="flex items-center justify-between p-6 hover:bg-zinc-900/30 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
                      <Database className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-100">
                        {backend.name}
                      </h3>
                      <p className="text-xs text-zinc-600 capitalize">
                        {backend.type}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                    <span>
                      {backend._count.documentTypes} document type
                      {backend._count.documentTypes !== 1 ? "s" : ""}
                    </span>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      {backend.testPassed ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-500" />
                      )}
                      <span>
                        {backend.testPassed ? "Connection OK" : "Not tested"}
                      </span>
                    </div>
                    {backend.testedAt && (
                      <>
                        <span>·</span>
                        <span>
                          Last tested{" "}
                          {new Date(backend.testedAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <Link
                  href={`/docx/${slug}/storage/${backend.id}`}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
