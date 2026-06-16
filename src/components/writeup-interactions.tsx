"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, MessageSquare, Send, Trash2, Loader2, Bookmark } from "lucide-react";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  user: { handle: string; displayName: string };
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

export function WriteupBookmark({ slug, loggedIn }: { slug: string; loggedIn: boolean }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!loggedIn || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "writeup", targetId: slug }),
      });
      const d = await res.json() as { bookmarked: boolean };
      setBookmarked(d.bookmarked);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={!loggedIn || busy}
      title={loggedIn ? (bookmarked ? "Remove bookmark" : "Bookmark") : "Sign in to bookmark"}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-xs transition-all disabled:cursor-not-allowed ${
        bookmarked
          ? "border-tide/40 bg-tide/10 text-tide"
          : "border-hair bg-abyss-800/60 text-ink-muted hover:border-tide/30 hover:text-tide"
      }`}
    >
      <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
    </button>
  );
}

export function WriteupLike({ slug, loggedIn }: { slug: string; loggedIn: boolean }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/writeups/${slug}/like`)
      .then((r) => r.json())
      .then((d: { liked: boolean; count: number }) => {
        setLiked(d.liked);
        setCount(d.count);
      })
      .catch(() => null);
  }, [slug]);

  async function toggle() {
    if (!loggedIn || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/writeups/${slug}/like`, { method: "POST" });
      const d = await res.json() as { liked: boolean; count: number };
      setLiked(d.liked);
      setCount(d.count);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={!loggedIn || busy}
      title={loggedIn ? (liked ? "Unlike" : "Like this writeup") : "Sign in to like"}
      className={`flex items-center gap-2 rounded-lg border px-4 py-2 font-mono text-xs transition-all disabled:cursor-not-allowed ${
        liked
          ? "border-red-500/40 bg-red-500/10 text-red-400"
          : "border-hair bg-abyss-800/60 text-ink-muted hover:border-red-500/30 hover:text-red-400"
      }`}
    >
      <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
      <span>{count}</span>
    </button>
  );
}

export function WriteupComments({
  slug,
  loggedIn,
  userHandle,
}: {
  slug: string;
  loggedIn: boolean;
  userHandle?: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/writeups/${slug}/comments`)
      .then((r) => r.json())
      .then((d: { comments: Comment[] }) => setComments(d.comments ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [slug]);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/writeups/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const d = await res.json() as { ok: boolean; comment?: Comment };
      if (d.ok && d.comment) {
        setComments((prev) => [...prev, d.comment!]);
        setText("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/writeups/${slug}/comments?id=${id}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="mt-14 border-t border-hair pt-10">
      <div className="mb-6 flex items-center gap-3">
        <MessageSquare className="h-4 w-4 text-ink-muted" />
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          Discussion · {comments.length}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-ink-faint">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-ink-faint">No comments yet. Be the first.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="group flex gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-abyss-700 font-mono text-[9px] uppercase text-tide ring-1 ring-tide/20">
                {c.user.handle.slice(0, 2)}
              </div>
              <div className="flex-1 rounded-xl border border-hair bg-abyss-800/40 px-4 py-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="font-mono text-xs font-medium text-ink-primary">
                    @{c.user.handle}
                  </span>
                  <span className="font-mono text-[10px] text-ink-faint">{timeAgo(c.createdAt)}</span>
                  {userHandle === c.user.handle && (
                    <button
                      onClick={() => remove(c.id)}
                      className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3 text-ink-faint hover:text-sev-high" />
                    </button>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-ink-secondary">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {loggedIn ? (
        <form onSubmit={post} className="mt-6">
          <div className="rounded-xl border border-hair bg-abyss-800/60 p-3 focus-within:border-tide/30 transition-colors">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment…"
              rows={3}
              maxLength={2000}
              className="w-full resize-none bg-transparent text-sm text-ink-primary outline-none placeholder:text-ink-faint"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-[10px] text-ink-faint">{text.length}/2000</span>
              <button
                type="submit"
                disabled={!text.trim() || busy}
                className="flex items-center gap-1.5 rounded-lg bg-tide px-3 py-1.5 font-mono text-[11px] font-bold text-abyss-900 transition-opacity disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                Post
              </button>
            </div>
          </div>
        </form>
      ) : (
        <p className="mt-6 text-sm text-ink-faint">
          <a href="/login" className="text-tide underline-offset-2 hover:underline">Sign in</a>
          {" "}to leave a comment.
        </p>
      )}
    </div>
  );
}
