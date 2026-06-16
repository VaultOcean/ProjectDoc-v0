import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArrowLeft, Plus, Users, Shield, Mail } from "lucide-react";

export default async function TeamManagementPage({
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

  const teamMembers = await db.companyUser.findMany({
    where: { companyId: company.id },
    include: {
      user: { select: { email: true, displayName: true } },
      role: { select: { name: true, level: true } },
    },
    orderBy: [{ role: { level: "asc" } }, { createdAt: "asc" }],
  });

  const roles = await db.role.findMany({
    where: { level: { gt: 0 } },
    orderBy: { level: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
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
            <h1 className="text-2xl font-bold text-zinc-100">Team Members</h1>
            <p className="mt-1 text-sm text-zinc-400">{company.displayName}</p>
          </div>
        </div>

        <Link
          href={`/docx/${slug}/team/invite`}
          className="flex items-center gap-2 rounded-lg bg-tide px-4 py-2 text-sm font-semibold text-black transition hover:bg-tide/90"
        >
          <Plus className="h-4 w-4" />
          Invite Member
        </Link>
      </div>

      {/* Team Members List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="divide-y divide-zinc-800">
          {teamMembers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-zinc-700" />
              <h3 className="text-lg font-semibold text-zinc-100">
                No Team Members
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                Invite team members to collaborate on documents.
              </p>
            </div>
          ) : (
            teamMembers.map((member, idx) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-6 hover:bg-zinc-900/30 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 flex-shrink-0">
                      <Mail className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-zinc-100 truncate">
                        {member.user.displayName || member.user.email}
                      </h3>
                      <p className="text-xs text-zinc-600">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex items-center gap-3">
                  <div className="flex items-center gap-1 rounded-lg bg-zinc-800/50 px-3 py-1.5">
                    <Shield className="h-3 w-3 text-zinc-400" />
                    <span className="text-xs font-semibold text-zinc-400 capitalize">
                      {member.role.name}
                    </span>
                  </div>

                  {idx !== 0 && (
                    <button className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-950/20 hover:border-red-900">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Role Reference */}
      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="font-semibold text-zinc-100 mb-4">Role Permissions</h2>
        <div className="space-y-3">
          {roles.map((role) => (
            <div key={role.id} className="border border-zinc-800 rounded-lg p-3">
              <h3 className="font-semibold text-zinc-100 capitalize">
                {role.name}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                {role.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
