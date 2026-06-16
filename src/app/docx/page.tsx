import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Building2, ArrowRight } from "lucide-react";

export default async function DocxPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/docx");
  }

  // Get all companies for this user
  const companies = await db.companyUser.findMany({
    where: { userId: user.id, status: "active" },
    include: {
      role: { select: { name: true } },
      company: {
        include: {
          _count: { select: { documentTypes: true, uploadBatches: true } },
        },
      },
    },
  });

  // If only one company, redirect there
  if (companies.length === 1) {
    redirect(`/docx/${companies[0]!.company.slug}/dashboard`);
  }

  // If no companies, show no access
  if (companies.length === 0) {
    redirect("/docx/no-access");
  }

  // Multiple companies — show selector
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Docx</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Select a company to continue
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {companies.map((cu) => (
          <Link
            key={cu.company.id}
            href={`/docx/${cu.company.slug}/dashboard`}
            className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800">
                <Building2 className="h-5 w-5 text-zinc-500" />
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-700 transition group-hover:text-tide" />
            </div>

            <div>
              <h2 className="font-semibold text-zinc-100">
                {cu.company.displayName}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-600 capitalize">
                {cu.role.name} · {cu.company.tier}
              </p>
            </div>

            <div className="flex gap-4 text-xs text-zinc-600">
              <span>{cu.company._count.documentTypes} doc type{cu.company._count.documentTypes !== 1 ? "s" : ""}</span>
              <span>·</span>
              <span>{cu.company._count.uploadBatches} batch{cu.company._count.uploadBatches !== 1 ? "es" : ""}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
