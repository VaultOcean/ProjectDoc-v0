"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, ArrowUpRight } from "lucide-react";

type BookmarkItem = {
  id: string;
  targetType: string;
  targetId: string;
  createdAt: string;
};

function targetUrl(b: BookmarkItem) {
  if (b.targetType === "writeup") return `/writeups/${b.targetId}`;
  if (b.targetType === "doc") return `/workspace/${b.targetId}`;
  if (b.targetType === "post") return `/posts/${b.targetId}`;
  return "#";
}

function targetLabel(b: BookmarkItem) {
  if (b.targetType === "writeup") return "Writeup";
  if (b.targetType === "doc") return "Document";
  if (b.targetType === "post") return "Post";
  return b.targetType;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((d: { bookmarks?: BookmarkItem[] }) => setBookmarks(d.bookmarks ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function remove(b: BookmarkItem) {
    await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: b.targetType, targetId: b.targetId }),
    });
    setBookmarks((prev) => prev.filter((x) => x.id !== b.id));
  }

  return (
    <div className="py-14 sm:py-20">
      <div className="mb-8 flex items-center gap-3">
        <Bookmark className="h-5 w-5 text-tide" />
        <h1 className="font-display text-2xl font-medium text-ink-primary">Bookmarks</h1>
        <span className="rounded-full border border-hair px-2.5 py-0.5 font-mono text-xs text-ink-muted">
          {bookmarks.length}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-16 animate-pulse bg-abyss-800/40" />
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Bookmark className="h-10 w-10 text-ink-faint" />
          <p className="text-sm text-ink-muted">No bookmarks yet.</p>
          <p className="text-xs text-ink-faint">
            Save writeups and docs using the bookmark button on each page.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookmarks.map((b) => (
            <div key={b.id} className="card group flex items-center gap-4 px-5 py-4">
              <span className="rounded border border-hair px-2 py-0.5 font-mono text-[10px] text-ink-muted">
                {targetLabel(b)}
              </span>
              <Link
                href={targetUrl(b)}
                className="flex flex-1 items-center gap-1 font-mono text-sm text-ink-primary transition-colors hover:text-tide"
              >
                {b.targetId}
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
              <span className="font-mono text-[10px] text-ink-faint">{timeAgo(b.createdAt)}</span>
              <button
                onClick={() => remove(b)}
                className="font-mono text-[10px] text-ink-faint transition-colors hover:text-sev-high"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
