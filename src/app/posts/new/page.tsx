"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BlockEditor } from "@/components/block-editor";
import { ArrowLeft, Loader2, Send, Save, Tag, X } from "lucide-react";
import Link from "next/link";

export default function NewPostPage() {
  const router = useRouter();
  const [postId, setPostId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save draft every 3s after changes
  useEffect(() => {
    if (!title.trim()) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveDraft(), 3000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, summary, body, tags]);

  async function saveDraft() {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId ?? undefined, title, summary, body, tags, action: "draft" }),
      });
      const d = await res.json() as { ok?: boolean; id?: string; error?: string };
      if (d.ok && d.id) {
        setPostId(d.id);
        setSavedAt(new Date().toLocaleTimeString());
      }
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!title.trim()) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId ?? undefined, title, summary, body, tags, action: "publish" }),
      });
      const d = await res.json() as { ok?: boolean; slug?: string; error?: string };
      if (d.ok && d.slug) {
        router.push(`/posts/${d.slug}`);
      }
    } finally {
      setPublishing(false);
    }
  }

  function addTag(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (t && !tags.includes(t) && tags.length < 5) {
        setTags((prev) => [...prev, t]);
      }
      setTagInput("");
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-14 sm:py-20">

      {/* Top bar */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/posts"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-muted transition-colors hover:text-tide"
        >
          <ArrowLeft className="h-3 w-3" />
          Posts
        </Link>

        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="font-mono text-[10px] text-ink-faint">
              {saving ? "Saving…" : `Saved ${savedAt}`}
            </span>
          )}
          <button
            type="button"
            onClick={saveDraft}
            disabled={saving || !title.trim()}
            className="flex items-center gap-1.5 rounded-lg border border-hair px-3 py-1.5 font-mono text-xs text-ink-muted transition-colors hover:border-hover hover:text-ink-primary disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save draft
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={publishing || !title.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-tide px-4 py-1.5 font-mono text-xs font-bold text-abyss-900 transition-opacity disabled:opacity-50"
          >
            {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Publish
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title…"
        maxLength={120}
        className="w-full bg-transparent font-display text-3xl font-medium text-ink-primary outline-none placeholder:text-ink-faint sm:text-4xl"
      />

      {/* Summary */}
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Short summary — shown in the feed (optional)"
        rows={2}
        maxLength={300}
        className="mt-4 w-full resize-none bg-transparent text-base leading-relaxed text-ink-secondary outline-none placeholder:text-ink-faint"
      />

      {/* Tags */}
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

      {/* Body */}
      <div className="mt-8">
        <BlockEditor
          content={body}
          onChange={setBody}
          placeholder="Write your post… Type '/' for blocks"
        />
      </div>

      <p className="mt-8 font-mono text-[10px] text-ink-faint">
        Publishing earns <span className="text-tide">+50ƒ</span>. Your post appears in the community feed immediately.
      </p>
    </div>
  );
}
