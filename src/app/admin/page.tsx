"use client";

import { useState, useEffect } from "react";
import { Trash2, RefreshCw, ShieldAlert, Users, Loader2 } from "lucide-react";

type User = {
  id: string;
  handle: string;
  email: string;
  fathoms: number;
  streakDays: number;
  createdAt: string;
  lastActiveOn: string | null;
  _count: { solves: number; docs: number };
};

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrateMsg, setMigrateMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(s = secret) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { "x-admin-secret": s },
      });
      const data = await res.json() as { ok: boolean; users?: User[]; error?: string };
      if (!data.ok) { setError(data.error ?? "Forbidden."); return; }
      setUsers(data.users ?? []);
      setAuthed(true);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyAll() {
    if (!confirm("Mark all unverified users as verified? Run this once after deploying email verification.")) return;
    setMigrating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "x-admin-secret": secret },
      });
      const data = await res.json() as { ok: boolean; updated?: number };
      if (data.ok) setMigrateMsg(`Done — ${data.updated} user(s) marked verified.`);
    } finally {
      setMigrating(false);
    }
  }

  async function deleteUser(id: string, handle: string) {
    if (!confirm(`Delete user @${handle}? This removes all their data permanently.`)) return;
    setDeleting(id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({ id }),
      });
      const data = await res.json() as { ok: boolean };
      if (data.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  if (!authed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-20">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-tide" />
            <h1 className="font-display text-2xl text-ink-primary">Admin panel</h1>
          </div>
          <p className="mb-6 text-sm text-ink-secondary">
            Enter the <code className="rounded bg-abyss-700 px-1.5 py-0.5 font-mono text-xs text-tide">ADMIN_SECRET</code> env variable value to proceed.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); load(); }} className="space-y-3">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Admin secret"
              className="w-full rounded-lg border border-hair bg-abyss-800 px-4 py-2.5 font-mono text-sm text-ink-primary outline-none placeholder:text-ink-faint focus:border-tide/50 focus:ring-1 focus:ring-tide/20"
            />
            {error && <p className="font-mono text-xs text-sev-high">{error}</p>}
            <button type="submit" disabled={loading} className="btn-tide w-full justify-center">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Access admin"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="py-14">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-tide" />
          <h1 className="font-display text-2xl text-ink-primary">Users</h1>
          <span className="rounded-full border border-hair px-2.5 py-0.5 font-mono text-xs text-ink-muted">
            {users.length} total
          </span>
        </div>
        <div className="flex items-center gap-2">
          {migrateMsg && (
            <span className="font-mono text-[11px] text-tide">{migrateMsg}</span>
          )}
          <button
            onClick={verifyAll}
            disabled={migrating}
            title="One-time: verify all existing users so they can still log in after email verification was deployed"
            className="btn-ghost gap-2 text-sm text-amber-400 border-amber-400/30 hover:bg-amber-400/10"
          >
            {migrating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Verify all existing users
          </button>
          <button onClick={() => load()} disabled={loading} className="btn-ghost gap-2 text-sm">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="card flex items-center gap-4 px-5 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-abyss-600 font-mono text-[10px] uppercase text-tide">
              {u.handle.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-medium text-ink-primary">@{u.handle}</span>
                <span className="font-mono text-xs text-ink-muted">{u.email}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap gap-3 font-mono text-[10px] text-ink-faint">
                <span className="text-tide">{u.fathoms.toLocaleString()}ƒ</span>
                <span>{u.streakDays}d streak</span>
                <span>{u._count.solves} solves</span>
                <span>{u._count.docs} docs</span>
                <span>joined {new Date(u.createdAt).toLocaleDateString()}</span>
                {u.lastActiveOn && (
                  <span>active {new Date(u.lastActiveOn).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => deleteUser(u.id, u.handle)}
              disabled={deleting === u.id}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hair text-ink-faint transition-colors hover:border-sev-high/40 hover:text-sev-high disabled:opacity-40"
              title="Delete user"
            >
              {deleting === u.id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        ))}
        {users.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">No users yet.</p>
        )}
      </div>
    </div>
  );
}
