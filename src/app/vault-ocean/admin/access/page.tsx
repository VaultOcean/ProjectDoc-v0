"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Trash2, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

interface VaultOceanAccessRecord {
  id: string;
  userId: string;
  isAdmin: boolean;
  canAccessAllModules: boolean;
  canManageCompanies: boolean;
  canManageBilling: boolean;
  grantedAt: string;
  user: { id: string; email: string; handle: string; displayName: string };
}

export default function VaultOceanAccessPage() {
  const router = useRouter();
  const [users, setUsers] = useState<VaultOceanAccessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantOptions, setGrantOptions] = useState({
    isAdmin: false,
    canAccessAllModules: false,
    canManageCompanies: false,
    canManageBilling: false,
  });
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/vault-ocean/admin/access");
      if (!res.ok) {
        if (res.status === 403) {
          router.push("/");
          return;
        }
        throw new Error("Failed to fetch users");
      }
      const data = await res.json() as { users: VaultOceanAccessRecord[] };
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleGrant() {
    setGranting(true);
    setError("");
    try {
      // Find user by email
      const searchRes = await fetch(`/api/users/search?email=${encodeURIComponent(grantEmail)}`);
      if (!searchRes.ok) throw new Error("User not found");
      const { user: foundUser } = await searchRes.json() as { user: { id: string } };

      const res = await fetch("/api/vault-ocean/admin/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: foundUser.id,
          ...grantOptions,
        }),
      });

      if (!res.ok) throw new Error("Failed to grant access");

      setModal(false);
      setGrantEmail("");
      setGrantOptions({
        isAdmin: false,
        canAccessAllModules: false,
        canManageCompanies: false,
        canManageBilling: false,
      });
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setGranting(false);
    }
  }

  async function handleRevoke(userId: string) {
    if (!confirm("Revoke VaultOcean access for this user?")) return;

    try {
      const res = await fetch(`/api/vault-ocean/admin/access?userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to revoke access");
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  const filtered = users.filter((u) =>
    u.user.email.toLowerCase().includes(search.toLowerCase()) ||
    u.user.handle.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">VaultOcean Access</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage who has access to VaultOcean features and modules
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 rounded-lg bg-tide px-4 py-2.5 font-mono text-sm font-bold text-abyss-900 transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Grant Access
        </button>
      </div>

      {error && (
        <div className="mb-6 flex gap-3 rounded-xl border border-red-900/40 bg-red-950/20 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="mb-6 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2">
        <Search className="h-4 w-4 text-zinc-600" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or handle..."
          className="flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
        />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-zinc-500">
            {users.length === 0 ? "No users granted VaultOcean access yet" : "No results"}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                  User
                </th>
                <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                  Permissions
                </th>
                <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                  Granted
                </th>
                <th className="px-4 py-3 text-right font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id} className="border-b border-zinc-800/40 transition hover:bg-zinc-900/20">
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <p className="font-mono text-sm text-zinc-200">{record.user.email}</p>
                      <p className="font-mono text-xs text-zinc-600">@{record.user.handle}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {record.isAdmin && (
                        <span className="flex items-center gap-1 rounded-full border border-red-900/60 bg-red-950/30 px-2 py-0.5 font-mono text-[10px] text-red-400">
                          <Check className="h-3 w-3" /> Admin
                        </span>
                      )}
                      {record.canAccessAllModules && (
                        <span className="flex items-center gap-1 rounded-full border border-tide/40 bg-tide/10 px-2 py-0.5 font-mono text-[10px] text-tide">
                          <Check className="h-3 w-3" /> All Modules
                        </span>
                      )}
                      {record.canManageCompanies && (
                        <span className="flex items-center gap-1 rounded-full border border-amber-900/40 bg-amber-950/10 px-2 py-0.5 font-mono text-[10px] text-amber-400">
                          <Check className="h-3 w-3" /> Manage Co.
                        </span>
                      )}
                      {record.canManageBilling && (
                        <span className="flex items-center gap-1 rounded-full border border-green-900/40 bg-green-950/10 px-2 py-0.5 font-mono text-[10px] text-green-400">
                          <Check className="h-3 w-3" /> Billing
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                    {new Date(record.grantedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRevoke(record.userId)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/40 bg-red-950/10 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:border-red-700 hover:bg-red-950/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-100">Grant VaultOcean Access</h2>

            <div className="mb-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">
                  User Email
                </label>
                <input
                  type="email"
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-tide/40 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={grantOptions.isAdmin}
                    onChange={(e) => setGrantOptions({ ...grantOptions, isAdmin: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs text-zinc-300">VaultOcean Superadmin</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={grantOptions.canAccessAllModules}
                    onChange={(e) => setGrantOptions({ ...grantOptions, canAccessAllModules: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs text-zinc-300">Access all modules (PentX, FILEx, etc.)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={grantOptions.canManageCompanies}
                    onChange={(e) => setGrantOptions({ ...grantOptions, canManageCompanies: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs text-zinc-300">Manage companies</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={grantOptions.canManageBilling}
                    onChange={(e) => setGrantOptions({ ...grantOptions, canManageBilling: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs text-zinc-300">Manage billing</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setModal(false)}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={handleGrant}
                disabled={!grantEmail || granting}
                className="flex-1 rounded-lg bg-tide px-4 py-2 text-sm font-semibold text-abyss-900 transition disabled:opacity-50 hover:opacity-90"
              >
                {granting ? "Granting..." : "Grant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
