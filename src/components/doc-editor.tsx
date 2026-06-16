"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Check, Loader2, Trash2, Globe, Lock, ExternalLink, Eye, PenLine,
  Link2, GitGraph, ChevronDown, Download, List,
} from "lucide-react";
import { BlockEditor } from "@/components/block-editor";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/cn";

type Doc = {
  id: string; title: string; summary: string; content: string;
  visibility: string; slug: string;
};
type SaveState = "idle" | "saving" | "saved" | "error";
type Backlink = { id: string; title: string; slug: string; updatedAt: Date };

export function DocEditor({ initial, authorHandle }: { initial: Doc; authorHandle: string }) {
  const router = useRouter();
  const [title,      setTitle]      = useState(initial.title);
  const [summary,    setSummary]    = useState(initial.summary);
  const [content,    setContent]    = useState(initial.content);
  const [visibility, setVisibility] = useState(initial.visibility);
  const [tab,        setTab]        = useState<"write" | "preview">("write");
  const [save,       setSave]       = useState<SaveState>("idle");
  const [backlinks,  setBacklinks]  = useState<Backlink[]>([]);
  const [blOpen,     setBlOpen]     = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tocOpen, setTocOpen] = useState(true);

  /* Live TOC — extracted from content HTML in real-time */
  const toc = useMemo(() => {
    const regex = /<h([1-3])[^>]*>([\s\S]*?)<\/h[1-3]>/gi;
    const matches = [...content.matchAll(regex)];
    return matches
      .map((m, i) => ({
        id: i,
        level: parseInt(m[1]),
        text: m[2].replace(/<[^>]+>/g, "").trim(),
      }))
      .filter((h) => h.text);
  }, [content]);

  /* Markdown export */
  function exportMarkdown() {
    const strip = (s: string) => s.replace(/<[^>]+>/g, "").trim();
    let md = `# ${title}\n\n`;
    if (summary) md += `> ${summary}\n\n`;

    const body = content
      // code blocks first (before inline code)
      .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_m, t) => `\`\`\`\n${strip(t)}\n\`\`\`\n\n`)
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, t) => `# ${strip(t)}\n\n`)
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, t) => `## ${strip(t)}\n\n`)
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, t) => `### ${strip(t)}\n\n`)
      .replace(/<strong>([\s\S]*?)<\/strong>/gi, (_m, t) => `**${strip(t)}**`)
      .replace(/<b>([\s\S]*?)<\/b>/gi, (_m, t) => `**${strip(t)}**`)
      .replace(/<em>([\s\S]*?)<\/em>/gi, (_m, t) => `*${strip(t)}*`)
      .replace(/<i>([\s\S]*?)<\/i>/gi, (_m, t) => `*${strip(t)}*`)
      .replace(/<code>([\s\S]*?)<\/code>/gi, (_m, t) => `\`${strip(t)}\``)
      .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, t) => `> ${strip(t)}\n\n`)
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, t) => `- ${strip(t)}\n`)
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, t) => `${strip(t)}\n\n`)
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    md += body;

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "untitled").replace(/[^a-z0-9-]/gi, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const persist = useCallback(
    async (patch: Partial<Doc>) => {
      setSave("saving");
      try {
        const res = await fetch(`/api/docs/${initial.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        setSave(res.ok ? "saved" : "error");
      } catch {
        setSave("error");
      }
    },
    [initial.id]
  );

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => persist({ title, summary, content }), 1100);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [title, summary, content, persist]);

  // Load backlinks on mount
  useEffect(() => {
    fetch(`/api/docs/${initial.id}/backlinks`)
      .then((r) => r.json())
      .then((d: { backlinks?: Backlink[] }) => setBacklinks(d.backlinks ?? []))
      .catch(() => null);
  }, [initial.id]);

  async function toggleVisibility() {
    const next = visibility === "public" ? "private" : "public";
    setVisibility(next);
    await persist({ title, summary, content, visibility: next });
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this document permanently?")) return;
    await fetch(`/api/docs/${initial.id}`, { method: "DELETE" });
    router.push("/workspace");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-[1100px] gap-8 py-8 sm:py-10">

      {/* ── Main editor column ── */}
      <div className="min-w-0 flex-1">
        {/* Toolbar */}
        <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-hair pb-4">
          <Link
            href="/workspace"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted transition-colors hover:text-tide"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Notes
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {/* Save state */}
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted">
              {save === "saving" && <><Loader2 className="h-3.5 w-3.5 animate-spin" /> saving…</>}
              {save === "saved"  && <><Check className="h-3.5 w-3.5 text-tide" /> saved</>}
              {save === "error"  && <span className="text-sev-high">save failed</span>}
            </span>

            {/* Write / Preview tabs */}
            <div className="flex gap-0.5 rounded-lg border border-hair p-0.5">
              {(["write", "preview"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs transition-colors",
                    tab === t ? "bg-abyss-600 text-tide" : "text-ink-muted hover:text-ink-primary"
                  )}>
                  {t === "write" ? <PenLine className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {t === "write" ? "Write" : "Preview"}
                </button>
              ))}
            </div>

            {/* Visibility */}
            <button type="button" onClick={toggleVisibility}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors",
                visibility === "public"
                  ? "border-tide/40 bg-tide/5 text-tide"
                  : "border-hair text-ink-secondary hover:border-hover hover:text-ink-primary"
              )}>
              {visibility === "public" ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {visibility === "public" ? "Public" : "Private"}
            </button>

            {/* Export Markdown */}
            <button
              type="button"
              onClick={exportMarkdown}
              title="Export as Markdown"
              className="inline-flex items-center gap-1.5 rounded-lg border border-hair px-3 py-1.5 font-mono text-xs text-ink-muted transition-colors hover:border-hover hover:text-ink-primary"
            >
              <Download className="h-3.5 w-3.5" />
              .md
            </button>

            <button type="button" onClick={remove}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-hair text-ink-muted transition-colors hover:border-sev-high/40 hover:text-sev-high"
              aria-label="Delete document">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Live URL */}
        {visibility === "public" && (
          <Link href={`/u/${authorHandle}/${initial.slug}`}
            className="mb-6 inline-flex items-center gap-1.5 rounded-lg border border-tide/25 bg-tide/5 px-3 py-2 font-mono text-xs text-tide transition-colors hover:border-tide/50">
            <ExternalLink className="h-3.5 w-3.5" />
            vaultocean.com/u/{authorHandle}/{initial.slug}
          </Link>
        )}

        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="w-full bg-transparent font-display text-4xl font-medium tracking-tight text-ink-primary outline-none placeholder:text-ink-faint sm:text-5xl"
          style={{ letterSpacing: "-0.03em", lineHeight: "1.1" }}
        />
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Add a one-line summary…"
          className="mt-4 w-full bg-transparent text-base leading-relaxed text-ink-secondary outline-none placeholder:text-ink-faint"
        />

        <div className="my-6 border-t border-hair" />

        {/* Editor or Preview */}
        {tab === "write" ? (
          <BlockEditor
            content={content}
            onChange={setContent}
            placeholder="Type '/' for commands — try /checklist, /code, /quote…"
          />
        ) : (
          <div className="min-h-[480px]">
            <Markdown content={content} />
          </div>
        )}

        {/* Wikilink hint */}
        <div className="mt-8 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-2.5 font-mono text-[10px] text-zinc-600">
          <span className="text-tide">[[title]]</span> — link to any note, report, or engagement. Connections appear in{" "}
          <Link href="/workspace/graph" className="text-zinc-400 hover:text-tide underline transition-colors">
            Graph view
          </Link>.
        </div>
      </div>

      {/* ── Right sidebar: TOC + backlinks + graph link ── */}
      <aside className="hidden w-56 shrink-0 xl:block">
        <div className="sticky top-8 space-y-4">

          {/* Table of Contents */}
          {toc.length > 0 && (
            <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40">
              <button
                onClick={() => setTocOpen((v) => !v)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left"
              >
                <div className="flex items-center gap-1.5">
                  <List className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="font-mono text-[11px] font-medium text-zinc-400">Contents</span>
                  <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-zinc-500">
                    {toc.length}
                  </span>
                </div>
                <ChevronDown className={cn("h-3 w-3 text-zinc-600 transition-transform", !tocOpen && "-rotate-90")} />
              </button>

              {tocOpen && (
                <div className="border-t border-zinc-800/60 px-2 py-2 space-y-0.5">
                  {toc.map((h) => (
                    <div
                      key={h.id}
                      className="truncate rounded-md px-2 py-1 font-mono text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-default"
                      style={{ paddingLeft: `${(h.level - 1) * 10 + 8}px` }}
                    >
                      <span className="mr-1.5 text-zinc-700">{'#'.repeat(h.level)}</span>
                      {h.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Graph shortcut */}
          <Link href="/workspace/graph"
            className="flex items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-2.5 text-zinc-500 hover:border-tide/30 hover:text-tide transition-colors group">
            <GitGraph className="h-3.5 w-3.5 shrink-0" />
            <span className="font-mono text-[11px]">Knowledge Graph</span>
          </Link>

          {/* Backlinks panel */}
          <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40">
            <button
              onClick={() => setBlOpen((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left"
            >
              <div className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-zinc-500" />
                <span className="font-mono text-[11px] font-medium text-zinc-400">Backlinks</span>
                {backlinks.length > 0 && (
                  <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-zinc-500">
                    {backlinks.length}
                  </span>
                )}
              </div>
              <ChevronDown className={cn("h-3 w-3 text-zinc-600 transition-transform", !blOpen && "-rotate-90")} />
            </button>

            {blOpen && (
              <div className="border-t border-zinc-800/60 px-2 py-2">
                {backlinks.length === 0 ? (
                  <p className="px-1 font-mono text-[10px] text-zinc-700">
                    No notes link here yet. Use <span className="text-tide">[[{title || "title"}]]</span> in another note to connect it.
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    {backlinks.map((b) => (
                      <Link key={b.id} href={`/workspace/${b.id}`}
                        className="block rounded-md px-2 py-1.5 font-mono text-[11px] text-zinc-400 hover:bg-zinc-800/60 hover:text-tide transition-colors truncate">
                        {b.title || "Untitled"}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
