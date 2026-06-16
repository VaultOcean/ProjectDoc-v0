import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArrowLeft, Activity, Eye, Edit2, Trash2, Plus } from "lucide-react";

const actionIcons: Record<string, React.ReactNode> = {
  created: <Plus className="h-4 w-4 text-green-500" />,
  updated: <Edit2 className="h-4 w-4 text-blue-500" />,
  deleted: <Trash2 className="h-4 w-4 text-red-500" />,
  viewed: <Eye className="h-4 w-4 text-zinc-500" />,
};

export default async function ActivityPage({
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

  const auditLogs = await db.auditLog.findMany({
    where: { companyId: company.id },
    include: {
      companyUser: { select: { user: { select: { email: true, displayName: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href={`/docx/${slug}/dashboard`}
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition"
        >
          <ArrowLeft className="h-4 w-4 text-zinc-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Activity Log</h1>
          <p className="mt-1 text-sm text-zinc-400">{company.displayName}</p>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        {auditLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="mx-auto mb-4 h-12 w-12 text-zinc-700" />
            <h3 className="text-lg font-semibold text-zinc-100">
              No Activity Yet
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Activities will appear here as team members work with documents.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {auditLogs.map((log) => {
              const icon = actionIcons[log.action] || <Activity className="h-4 w-4" />;

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 hover:bg-zinc-900/30 transition"
                >
                  <div className="mt-1 flex-shrink-0">
                    {icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-zinc-100">
                        {log.companyUser?.user?.displayName || log.companyUser?.user?.email || "Unknown"}
                      </span>
                      <span className="text-sm text-zinc-400 capitalize">
                        {log.action}
                      </span>
                      <span className="text-sm text-zinc-500">
                        {log.resource}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 mt-1">
                      {log.resourceId}
                    </p>

                    {log.details && (
                      <div className="mt-2 rounded bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-400 max-w-md overflow-auto">
                        {typeof log.details === "string"
                          ? log.details
                          : JSON.stringify(log.details, null, 2)}
                      </div>
                    )}

                    <p className="text-xs text-zinc-700 mt-2">
                      {log.createdAt.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
