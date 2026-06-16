"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, MessageSquare, Heart, UserPlus, Trophy, Check } from "lucide-react";

type Notification = {
  id: string;
  kind: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const icons: Record<string, React.ReactNode> = {
  comment: <MessageSquare className="h-4 w-4 text-tide" />,
  like:    <Heart className="h-4 w-4 text-red-400" />,
  follow:  <UserPlus className="h-4 w-4 text-purple-400" />,
  solve:   <Trophy className="h-4 w-4 text-amber-400" />,
};

export default function NotificationsPage() {
  const [notes, setNotes] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d: { notifications?: Notification[] }) => setNotes(d.notifications ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));

    // Mark all as read
    fetch("/api/notifications", { method: "PATCH" }).catch(() => null);
  }, []);

  return (
    <div className="py-14 sm:py-20">
      <div className="mb-8 flex items-center gap-3">
        <Bell className="h-5 w-5 text-tide" />
        <h1 className="font-display text-2xl font-medium text-ink-primary">Notifications</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card h-16 animate-pulse bg-abyss-800/40" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Bell className="h-10 w-10 text-ink-faint" />
          <p className="text-sm text-ink-muted">Nothing here yet. Start engaging with the community.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notes.map((n) => {
            const content = (
              <div className={`card flex items-start gap-4 px-5 py-4 transition-colors ${!n.read ? "border-tide/20 bg-tide/[0.03]" : ""}`}>
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-hair bg-abyss-700">
                  {icons[n.kind] ?? <Bell className="h-4 w-4 text-ink-muted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink-primary">{n.body}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-ink-faint">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-tide" />
                )}
              </div>
            );

            return n.link ? (
              <Link key={n.id} href={n.link}>{content}</Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}

      {notes.length > 0 && (
        <div className="mt-6 flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-ink-faint" />
          <p className="font-mono text-[11px] text-ink-faint">All notifications marked as read</p>
        </div>
      )}
    </div>
  );
}
