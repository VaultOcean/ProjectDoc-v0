"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

type FollowData = {
  ok: boolean;
  followers: number;
  following: number;
  isFollowing: boolean;
};

export function FollowStats({
  handle,
  isOwnProfile,
}: {
  handle: string;
  isOwnProfile?: boolean;
}) {
  const [data, setData] = useState<FollowData | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${handle}/follow`)
      .then((r) => r.json())
      .then((d: FollowData) => setData(d))
      .catch(() => null);
  }, [handle]);

  async function toggle() {
    if (!data || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${handle}/follow`, { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const d = await res.json() as { ok: boolean; following: boolean; followers: number };
      setData((prev) => prev ? { ...prev, isFollowing: d.following, followers: d.followers } : prev);
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <div className="flex items-center gap-4">
        <div className="h-4 w-32 animate-pulse rounded bg-abyss-700" />
        {!isOwnProfile && <div className="h-8 w-20 animate-pulse rounded-lg bg-abyss-700" />}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-4 font-mono text-[11px] text-ink-muted">
        <span>
          <span className="font-medium text-ink-primary">{data.followers.toLocaleString()}</span>
          {" "}followers
        </span>
        <span>
          <span className="font-medium text-ink-primary">{data.following.toLocaleString()}</span>
          {" "}following
        </span>
      </div>

      {!isOwnProfile && (
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs transition-all disabled:opacity-50 ${
            data.isFollowing
              ? "border-tide/40 bg-tide/10 text-tide hover:border-sev-high/40 hover:bg-sev-high/10 hover:text-sev-high"
              : "border-hair bg-abyss-800 text-ink-secondary hover:border-tide/40 hover:text-tide"
          }`}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : data.isFollowing ? (
            <UserMinus className="h-3.5 w-3.5" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          {data.isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}
