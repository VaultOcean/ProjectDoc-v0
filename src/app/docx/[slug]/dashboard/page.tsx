import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Users, Settings, BarChart3, Upload } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Dashboard — Docx",
};

export default async function DocxDashboard({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { slug } = await params;

  // Get company with all necessary data
  const company = await db.company.findUnique({
    where: { slug },
    include: {
      documentTypes: { take: 5, orderBy: { createdAt: "desc" } },
      uploadBatches: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          documentType: { select: { name: true } },
          createdByUser: {
            select: {
              user: { select: { displayName: true, email: true } }
            }
          },
          _count: { select: { documents: true } },
        },
      },
      _count: {
        select: {
          documentTypes: true,
          uploadBatches: true,
          users: true,
        },
      },
    },
  });

  if (!company) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-6">
          <p className="text-red-300">Company not found</p>
        </div>
      </div>
    );
  }

  const companyUser = await db.companyUser.findUnique({
    where: { companyId_userId: { companyId: company.id, userId: user.id } },
    include: { role: true },
  });

  if (!companyUser) {
    redirect("/docx/no-access");
  }

  const docTypeCount = company._count.documentTypes;
  const batchCount = company._count.uploadBatches;
  const userCount = company._count.users;
  const recentBatches = company.uploadBatches;

  const isAdmin = companyUser.role.level <= 1; // superadmin or admin

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">{company.displayName}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {companyUser.role.name.charAt(0).toUpperCase() +
            companyUser.role.name.slice(1)}{" "}
          · Docx Enterprise
        </p>
      </div>

      {/* Quick stats */}
      <div className="mb-8 grid gap-3 sm:grid-cols-4">
        {[
          {
            label: "Document Types",
            value: docTypeCount,
            icon: FileText,
            href: "/docx/[slug]/document-types",
          },
          {
            label: "Batches",
            value: batchCount,
            icon: Upload,
            href: "/docx/[slug]/batches",
          },
          {
            label: "Team Members",
            value: userCount,
            icon: Users,
            href: "/docx/[slug]/users",
          },
          {
            label: "Activity",
            value: "—",
            icon: BarChart3,
            href: "/docx/[slug]/audit",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          const href = stat.href.replace("[slug]", slug);
          const isClickable = isAdmin || stat.label === "Activity";

          return (
            <Link
              key={stat.label}
              href={isClickable ? href : "#"}
              className={`flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 ${
                isClickable
                  ? "transition hover:border-zinc-700"
                  : "cursor-not-allowed opacity-70"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-zinc-600" />
                <p className="text-lg font-bold text-zinc-100">{stat.value}</p>
              </div>
              <p className="text-xs text-zinc-500">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Main content area */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Quick actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent batches */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60">
            <div className="border-b border-zinc-800 px-4 py-3">
              <h2 className="font-semibold text-zinc-100">Recent Batches</h2>
            </div>

            {recentBatches.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-zinc-500">
                  No batches yet.{" "}
                  {companyUser.role.level <= 3 && (
                    <Link
                      href={`/docx/${slug}/batches/new`}
                      className="text-tide hover:underline"
                    >
                      Create one
                    </Link>
                  )}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {recentBatches.map((batch) => (
                  <Link
                    key={batch.id}
                    href={`/docx/${slug}/batches/${batch.id}`}
                    className="flex items-center justify-between px-4 py-3 transition hover:bg-zinc-900/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm text-zinc-200">
                        {batch.name}
                      </p>
                      <p className="text-xs text-zinc-600">
                        {batch.documentType.name} ·{" "}
                        {batch._count.documents} file{batch._count.documents !== 1 ? "s" : ""} ·{" "}
                        {batch.createdByUser.user.displayName}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
                        batch.status === "completed"
                          ? "border border-green-900/40 bg-green-950/20 text-green-400"
                          : batch.status === "processing"
                          ? "border border-blue-900/40 bg-blue-950/20 text-blue-400"
                          : "border border-zinc-700 bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {batch.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Navigation */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Quick Navigation
          </p>

          {[
            {
              label: "Document Types",
              href: `/docx/${slug}/document-types`,
              icon: FileText,
              admin: false,
            },
            {
              label: "Create Batch",
              href: `/docx/${slug}/batches/new`,
              icon: Upload,
              admin: false,
            },
            {
              label: "Team Members",
              href: `/docx/${slug}/users`,
              icon: Users,
              admin: true,
            },
            {
              label: "Storage Config",
              href: `/docx/${slug}/storage`,
              icon: Settings,
              admin: true,
            },
            {
              label: "Audit Logs",
              href: `/docx/${slug}/audit`,
              icon: BarChart3,
              admin: true,
            },
          ].map((item) => {
            const Icon = item.icon;
            const canAccess = !item.admin || isAdmin;

            return (
              <Link
                key={item.label}
                href={canAccess ? item.href : "#"}
                className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                  canAccess
                    ? "border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100"
                    : "border-zinc-800 bg-zinc-900/20 text-zinc-600 cursor-not-allowed opacity-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
