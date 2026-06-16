"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { BlockEditor } from "@/components/block-editor";
import { ArrowLeft, Loader2, Send, Save, Tag, X } from "lucide-react";
import Link from "next/link";

export default function EditPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [postId, setPostId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/posts/${slug}`)
      .then((r) => r.json())
      .then((d: { id?: string; title?: string; summary?: string; body?: string; tags?: string[]; isOwner?: boolean }) => {
        if (!d.isOwner) { router.replace(`/posts/${slug}`); return; }
        setPostId(d.id ?? null);
        setTitle(d.title ?? "");
        setSummary(d.summary ?? "");
        setBody(d.body ?? "");
        setTags(Array.isArray(d.tags) ? d.tags : []);
      })
      .catch(() => router.replace("/posts"))
      .finally(() => setLoading(false));
  }, [slug, router]);

  useEffect(() => {
    if (!title.trim() || loading) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => save("draft"), 3000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, summary, body, tags]);

  async function save(action: "draft" | "publish") {
    if (!title.trim() || saving || !postId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId, title, summary, body, tags, action }),
      });
      const d = await res.json() as { ok?: boolean; slug?: string };
      if (d.ok) {
        setSavedAt(new Date().toLocaleTimeString());
        if (action === "publish" && d.slug) router.push(`/posts/${d.slug}`);
      }
    } finally {
      setSaving(false);
    }
  }

  function addTag(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (t && !tags.includes(t) && tags.length < 5) setTags((prev) => [...prev, t]);
      setTagInput("");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-tide" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-14 sm:py-20">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href={`/posts/${slug}`}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-muted transition-colors hover:text-tide"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Link>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="font-mono text-[10px] text-ink-faint">
              {saving ? "Saving…" : `Saved ${savedAt}`}
            </span>
          )}
          <button
            type="button"
            onClick={() => save("draft")}
            disabled={saving || !title.trim()}
            className="flex items-center gap-1.5 rounded-lg border border-hair px-3 py-1.5 font-mono text-xs text-ink-muted transition-colors hover:border-hover hover:text-ink-primary disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
          <button
            type="button"
            onClick={() => save("publish")}
            disabled={saving || !title.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-tide px-4 py-1.5 font-mono text-xs font-bold text-abyss-900 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Update
          </button>
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title…"
        maxLength={120}
        className="w-full bg-transparent font-display text-3xl font-medium text-ink-primary outline-none placeholder:text-ink-faint sm:text-4xl"
      />
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Short summary (optional)"
        rows={2}
        maxLength={300}
        className="mt-4 w-full resize-none bg-transparent text-base leading-relaxed text-ink-secondary outline-none placeholder:text-ink-faint"
      />
      <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-hair pb-6">
        <Tag className="h-3.5 w-3.5 text-ink-faint" />
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 rounded-full border border-hair px-2.5 py-0.5 font-mono text-[11px] text-ink-secondary">
            {t}
            <button type="button" onClick={() => setTags((prev) => prev.filter((x) => x !== t))}>
              <X className="h-2.5 w-2.5 text-ink-faint hover:text-sev-high" />
            </button>
          </span>
        ))}
        {tags.length < 5 && (
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder="Add tag (Enter)"
            className="min-w-0 bg-transparent font-mono text-[11px] text-ink-secondary outline-none placeholder:text-ink-faint"
          />
        )}
      </div>
      <div className="mt-8">
        <BlockEditor content={body} onChange={setBody} placeholder="Write your post… Type '/' for blocks" />
      </div>
    </div>
  );
}
