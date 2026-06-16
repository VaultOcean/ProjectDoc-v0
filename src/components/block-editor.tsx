"use client";

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import LinkExt from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Typography from "@tiptap/extension-typography";
import CharacterCount from "@tiptap/extension-character-count";
import TextStyle from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
  Link as LinkIcon, Heading1, Heading2, Heading3, List, ListOrdered,
  CheckSquare, Quote, Code2, Minus, AlignLeft, AlignCenter, AlignRight,
  Highlighter, Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  Image as ImageIcon, Type, ChevronDown, Loader2,
} from "lucide-react";
import { cn } from "@/lib/cn";

/* ──────────────────────────────────────────────
   Block type registry for slash menu
   ────────────────────────────────────────────── */
const BLOCK_TYPES = [
  {
    key: "paragraph",
    label: "Text",
    desc: "Start with plain text",
    Icon: AlignLeft,
    keywords: ["paragraph", "plain", "body"],
    apply: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().setParagraph().run(),
  },
  {
    key: "h1",
    label: "Heading 1",
    desc: "Large section heading",
    Icon: Heading1,
    keywords: ["h1", "heading", "title", "big"],
    apply: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().setHeading({ level: 1 }).run(),
  },
  {
    key: "h2",
    label: "Heading 2",
    desc: "Medium section heading",
    Icon: Heading2,
    keywords: ["h2", "heading", "section"],
    apply: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().setHeading({ level: 2 }).run(),
  },
  {
    key: "h3",
    label: "Heading 3",
    desc: "Small section heading",
    Icon: Heading3,
    keywords: ["h3", "heading", "subsection"],
    apply: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().setHeading({ level: 3 }).run(),
  },
  {
    key: "bullet",
    label: "Bullet list",
    desc: "Unordered list of items",
    Icon: List,
    keywords: ["bullet", "unordered", "list", "ul"],
    apply: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().toggleBulletList().run(),
  },
  {
    key: "ordered",
    label: "Numbered list",
    desc: "Ordered numbered list",
    Icon: ListOrdered,
    keywords: ["numbered", "ordered", "list", "ol"],
    apply: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().toggleOrderedList().run(),
  },
  {
    key: "task",
    label: "Checklist",
    desc: "Track tasks with checkboxes",
    Icon: CheckSquare,
    keywords: ["task", "todo", "check", "checklist"],
    apply: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().toggleTaskList().run(),
  },
  {
    key: "quote",
    label: "Quote",
    desc: "Highlight a quote or callout",
    Icon: Quote,
    keywords: ["quote", "blockquote", "callout"],
    apply: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().toggleBlockquote().run(),
  },
  {
    key: "code",
    label: "Code block",
    desc: "Fenced code with syntax style",
    Icon: Code2,
    keywords: ["code", "snippet", "block", "pre"],
    apply: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().toggleCodeBlock().run(),
  },
  {
    key: "hr",
    label: "Divider",
    desc: "Horizontal visual separator",
    Icon: Minus,
    keywords: ["divider", "rule", "separator", "hr"],
    apply: (editor: ReturnType<typeof useEditor>) =>
      editor?.chain().focus().setHorizontalRule().run(),
  },
  {
    key: "image",
    label: "Image",
    desc: "Upload or paste an image URL",
    Icon: ImageIcon,
    keywords: ["image", "photo", "picture", "img", "upload"],
    apply: () => {
      // handled specially in applySlashBlock — triggers hidden file input
    },
  },
];

/* ──────────────────────────────────────────────
   Slash command menu
   ────────────────────────────────────────────── */
function SlashMenu({
  query,
  onSelect,
  onClose,
}: {
  query: string;
  onSelect: (type: (typeof BLOCK_TYPES)[number]) => void;
  onClose: () => void;
}) {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = BLOCK_TYPES.filter((b) => {
    const q = query.toLowerCase();
    return (
      b.label.toLowerCase().includes(q) ||
      b.desc.toLowerCase().includes(q) ||
      b.keywords.some((k) => k.includes(q))
    );
  });

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => (i + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => (i - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[active]) onSelect(filtered[active]);
      } else if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [filtered, active, onSelect, onClose]);

  if (filtered.length === 0) {
    return (
      <div className="w-64 rounded-xl border border-hair bg-abyss-800 px-3 py-3 shadow-2xl">
        <p className="font-mono text-[11px] text-ink-faint">No blocks match "{query}"</p>
      </div>
    );
  }

  return (
    <div className="w-72 overflow-hidden rounded-xl border border-hair bg-abyss-800 shadow-2xl">
      <p className="px-3 pb-1 pt-2.5 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
        Blocks
      </p>
      <div ref={listRef} className="max-h-72 overflow-y-auto pb-2">
        {filtered.map((b, i) => (
          <button
            key={b.key}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(b);
            }}
            onMouseEnter={() => setActive(i)}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-2 transition-colors",
              i === active
                ? "bg-tide/10 text-ink-primary"
                : "text-ink-secondary hover:bg-abyss-700/60"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hair bg-abyss-900">
              <b.Icon className="h-4 w-4 text-tide" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium leading-tight text-ink-primary">{b.label}</p>
              <p className="text-[11px] leading-tight text-ink-muted">{b.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Link input inside bubble menu
   ────────────────────────────────────────────── */
function LinkInput({
  editor,
  onClose,
}: {
  editor: ReturnType<typeof useEditor>;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(editor?.getAttributes("link").href ?? "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  function apply() {
    if (!url) {
      editor?.chain().focus().unsetLink().run();
    } else {
      editor?.chain().focus().setLink({ href: url, target: "_blank" }).run();
    }
    onClose();
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-tide/40 bg-abyss-800 px-3 py-2 shadow-xl">
      <input
        ref={ref}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") apply();
          if (e.key === "Escape") onClose();
        }}
        placeholder="https://…"
        className="w-52 bg-transparent font-mono text-xs text-ink-primary outline-none placeholder:text-ink-faint"
      />
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); apply(); }}
        className="font-mono text-[11px] text-tide hover:underline"
      >
        Apply
      </button>
      {url && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().unsetLink().run();
            onClose();
          }}
          className="font-mono text-[11px] text-ink-muted hover:text-sev-high"
        >
          Remove
        </button>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Highlight colour picker
   ────────────────────────────────────────────── */
const HIGHLIGHT_COLORS = [
  { label: "Yellow",  color: "rgba(255,236,100,0.25)" },
  { label: "Green",   color: "rgba(159,239,0,0.20)"   },
  { label: "Cyan",    color: "rgba(46,230,214,0.20)"  },
  { label: "Red",     color: "rgba(255,80,80,0.22)"   },
  { label: "Purple",  color: "rgba(178,100,255,0.22)" },
];

function HighlightPicker({ editor, onClose }: { editor: ReturnType<typeof useEditor>; onClose: () => void }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-hair bg-abyss-800 p-2 shadow-xl">
      {HIGHLIGHT_COLORS.map(({ label, color }) => (
        <button
          key={label}
          title={label}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().setHighlight({ color }).run();
            onClose();
          }}
          style={{ background: color, border: "1px solid rgba(255,255,255,0.12)" }}
          className="h-5 w-5 rounded-full transition-transform hover:scale-110"
        />
      ))}
      <button
        type="button"
        title="Remove highlight"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().unsetHighlight().run();
          onClose();
        }}
        className="ml-1 font-mono text-[10px] text-ink-muted hover:text-ink-primary"
      >
        ✕
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Block type switcher dropdown in bubble menu
   ────────────────────────────────────────────── */
const INLINE_BLOCK_TYPES = [
  { label: "Text",    Icon: Type,        apply: (e: ReturnType<typeof useEditor>) => e?.chain().focus().setParagraph().run() },
  { label: "H1",      Icon: Heading1,    apply: (e: ReturnType<typeof useEditor>) => e?.chain().focus().setHeading({ level: 1 }).run() },
  { label: "H2",      Icon: Heading2,    apply: (e: ReturnType<typeof useEditor>) => e?.chain().focus().setHeading({ level: 2 }).run() },
  { label: "H3",      Icon: Heading3,    apply: (e: ReturnType<typeof useEditor>) => e?.chain().focus().setHeading({ level: 3 }).run() },
  { label: "List",    Icon: List,        apply: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleBulletList().run() },
  { label: "Quote",   Icon: Quote,       apply: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleBlockquote().run() },
];

/* ──────────────────────────────────────────────
   Main BlockEditor component
   ────────────────────────────────────────────── */
export type BlockEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

export function BlockEditor({ content, onChange, placeholder, className }: BlockEditorProps) {
  const [slashOpen, setSlashOpen]     = useState(false);
  const [slashQuery, setSlashQuery]   = useState("");
  const [slashCoords, setSlashCoords] = useState<{ top: number; left: number } | null>(null);
  const [linkMode, setLinkMode]       = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [blockTypeOpen, setBlockTypeOpen] = useState(false);
  const [imgUploading, setImgUploading]   = useState(false);
  const editorRef   = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading:   { levels: [1, 2, 3] },
        codeBlock: { languageClassPrefix: "language-" },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            const lvl = node.attrs.level as number;
            return lvl === 1 ? "Heading 1" : lvl === 2 ? "Heading 2" : "Heading 3";
          }
          return placeholder ?? "Type '/' for commands…";
        },
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      LinkExt.configure({ openOnClick: false, autolink: true }),
      Underline,
      Typography,
      CharacterCount,
      TextStyle,
      Highlight.configure({ multicolor: true }),
      Superscript,
      Subscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: false, allowBase64: true }),
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class: "tiptap-editor focus:outline-none",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  /* ── Sync external content changes (e.g. on first load) ── */
  useEffect(() => {
    if (!editor) return;
    if (content && editor.getHTML() !== content) {
      editor.commands.setContent(content, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  /* ── Slash command detection ── */
  useEffect(() => {
    if (!editor) return;
    const handle = () => {
      const { from } = editor.state.selection;
      const text = editor.state.doc.textBetween(Math.max(0, from - 30), from, "\n", "\n");
      const slashIdx = text.lastIndexOf("/");

      if (slashIdx >= 0) {
        const query = text.slice(slashIdx + 1);
        if (!query.includes(" ") && !query.includes("\n")) {
          setSlashQuery(query);
          const domPos = editor.view.coordsAtPos(Math.max(0, from - query.length - 1));
          const box = editorRef.current?.getBoundingClientRect();
          if (box && domPos) {
            setSlashCoords({ top: domPos.bottom - box.top + 6, left: domPos.left - box.left });
          }
          setSlashOpen(true);
          return;
        }
      }
      setSlashOpen(false);
    };

    editor.on("transaction", handle);
    return () => { editor.off("transaction", handle); };
  }, [editor]);

  /* ── Upload image file and insert into editor ── */
  async function handleImageFile(file: File) {
    if (!editor || !file.type.startsWith("image/")) return;
    setImgUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const d = await res.json() as { url?: string; error?: string };
      if (d.url) {
        editor.chain().focus().setImage({ src: d.url }).run();
      } else {
        alert(d.error ?? "Upload failed");
      }
    } finally {
      setImgUploading(false);
    }
  }

  /* ── Apply slash block ── */
  const applySlashBlock = useCallback(
    (block: (typeof BLOCK_TYPES)[number]) => {
      if (!editor) return;
      setSlashOpen(false);
      const { from } = editor.state.selection;
      const text = editor.state.doc.textBetween(Math.max(0, from - 30), from, "\n", "\n");
      const slashIdx = text.lastIndexOf("/");
      const deleteFrom = from - (text.length - slashIdx);
      editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
      if (block.key === "image") {
        fileInputRef.current?.click();
        return;
      }
      block.apply(editor);
    },
    [editor]
  );

  /* ── Close menus on outside click ── */
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!editorRef.current?.contains(e.target as Node)) {
        setSlashOpen(false);
        setHighlightOpen(false);
        setBlockTypeOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const charCount = editor?.storage.characterCount?.characters() ?? 0;

  /* ── Current block label for switcher ── */
  function currentBlockLabel() {
    if (!editor) return "Text";
    if (editor.isActive("heading", { level: 1 })) return "H1";
    if (editor.isActive("heading", { level: 2 })) return "H2";
    if (editor.isActive("heading", { level: 3 })) return "H3";
    if (editor.isActive("bulletList"))  return "List";
    if (editor.isActive("blockquote"))  return "Quote";
    if (editor.isActive("codeBlock"))   return "Code";
    return "Text";
  }

  return (
    <div ref={editorRef} className={cn("relative", className)}>
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
          e.target.value = "";
        }}
      />
      {imgUploading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-abyss-900/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-lg border border-hair bg-abyss-800 px-4 py-2.5 shadow-xl">
            <Loader2 className="h-4 w-4 animate-spin text-tide" />
            <span className="font-mono text-xs text-ink-secondary">Uploading image…</span>
          </div>
        </div>
      )}

      {/* ── Bubble menu: appears on text selection ── */}
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100, placement: "top" }}
          shouldShow={({ from, to }) => {
            if (linkMode || highlightOpen || blockTypeOpen) return true;
            return from !== to && !editor.isActive("codeBlock");
          }}
        >
          {linkMode ? (
            <LinkInput editor={editor} onClose={() => setLinkMode(false)} />
          ) : highlightOpen ? (
            <HighlightPicker editor={editor} onClose={() => setHighlightOpen(false)} />
          ) : blockTypeOpen ? (
            <div className="flex flex-wrap gap-1 rounded-lg border border-hair bg-abyss-800 p-1.5 shadow-xl">
              {INLINE_BLOCK_TYPES.map(({ label, Icon, apply }) => (
                <button
                  key={label}
                  type="button"
                  title={label}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    apply(editor);
                    setBlockTypeOpen(false);
                  }}
                  className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-ink-secondary transition-colors hover:bg-abyss-700 hover:text-tide"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="font-mono text-[10px]">{label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-0.5 rounded-lg border border-hair bg-abyss-800 p-1 shadow-2xl">
              {/* Block type switcher */}
              <button
                type="button"
                title="Turn into…"
                onMouseDown={(e) => { e.preventDefault(); setBlockTypeOpen(true); }}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-ink-secondary transition-colors hover:bg-abyss-700 hover:text-ink-primary"
              >
                <span className="font-mono text-[10px]">{currentBlockLabel()}</span>
                <ChevronDown className="h-3 w-3 text-ink-faint" />
              </button>

              <div className="mx-1 h-4 w-px bg-hair" />

              {/* Inline marks */}
              {[
                { mark: "bold",      Icon: Bold,          title: "Bold ⌘B",       action: () => editor.chain().focus().toggleBold().run() },
                { mark: "italic",    Icon: Italic,        title: "Italic ⌘I",     action: () => editor.chain().focus().toggleItalic().run() },
                { mark: "underline", Icon: UnderlineIcon, title: "Underline ⌘U",  action: () => editor.chain().focus().toggleUnderline().run() },
                { mark: "strike",    Icon: Strikethrough, title: "Strikethrough", action: () => editor.chain().focus().toggleStrike().run() },
                { mark: "code",      Icon: Code,          title: "Inline code",   action: () => editor.chain().focus().toggleCode().run() },
              ].map(({ mark, Icon, title, action }) => (
                <button
                  key={mark}
                  type="button"
                  title={title}
                  onMouseDown={(e) => { e.preventDefault(); action(); }}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                    editor.isActive(mark)
                      ? "bg-tide/15 text-tide"
                      : "text-ink-secondary hover:bg-abyss-700 hover:text-ink-primary"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}

              <div className="mx-1 h-4 w-px bg-hair" />

              {/* Superscript / Subscript */}
              <button
                type="button"
                title="Superscript"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleSuperscript().run(); }}
                className={cn("flex h-7 w-7 items-center justify-center rounded-md transition-colors", editor.isActive("superscript") ? "bg-tide/15 text-tide" : "text-ink-secondary hover:bg-abyss-700 hover:text-ink-primary")}
              >
                <SuperscriptIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Subscript"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleSubscript().run(); }}
                className={cn("flex h-7 w-7 items-center justify-center rounded-md transition-colors", editor.isActive("subscript") ? "bg-tide/15 text-tide" : "text-ink-secondary hover:bg-abyss-700 hover:text-ink-primary")}
              >
                <SubscriptIcon className="h-3.5 w-3.5" />
              </button>

              <div className="mx-1 h-4 w-px bg-hair" />

              {/* Highlight */}
              <button
                type="button"
                title="Highlight"
                onMouseDown={(e) => { e.preventDefault(); setHighlightOpen(true); }}
                className={cn("flex h-7 w-7 items-center justify-center rounded-md transition-colors", editor.isActive("highlight") ? "bg-tide/15 text-tide" : "text-ink-secondary hover:bg-abyss-700 hover:text-ink-primary")}
              >
                <Highlighter className="h-3.5 w-3.5" />
              </button>

              {/* Link */}
              <button
                type="button"
                title="Add link"
                onMouseDown={(e) => { e.preventDefault(); setLinkMode(true); }}
                className={cn("flex h-7 w-7 items-center justify-center rounded-md transition-colors", editor.isActive("link") ? "bg-tide/15 text-tide" : "text-ink-secondary hover:bg-abyss-700 hover:text-ink-primary")}
              >
                <LinkIcon className="h-3.5 w-3.5" />
              </button>

              <div className="mx-1 h-4 w-px bg-hair" />

              {/* Text align */}
              {[
                { align: "left",   Icon: AlignLeft,   title: "Align left"   },
                { align: "center", Icon: AlignCenter, title: "Align center" },
                { align: "right",  Icon: AlignRight,  title: "Align right"  },
              ].map(({ align, Icon, title }) => (
                <button
                  key={align}
                  type="button"
                  title={title}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editor.chain().focus().setTextAlign(align).run();
                  }}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                    editor.isActive({ textAlign: align })
                      ? "bg-tide/15 text-tide"
                      : "text-ink-secondary hover:bg-abyss-700 hover:text-ink-primary"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          )}
        </BubbleMenu>
      )}

      {/* ── Slash command popover ── */}
      {slashOpen && slashCoords && (
        <div
          className="absolute z-50"
          style={{ top: slashCoords.top, left: slashCoords.left }}
        >
          <SlashMenu
            query={slashQuery}
            onSelect={applySlashBlock}
            onClose={() => setSlashOpen(false)}
          />
        </div>
      )}

      {/* ── Tiptap editor area ── */}
      <EditorContent editor={editor} />

      {/* ── Footer: word + char count ── */}
      <div className="mt-4 flex items-center gap-3">
        <span className="font-mono text-[10px] text-ink-faint">
          {wordCount.toLocaleString()} word{wordCount !== 1 ? "s" : ""}
        </span>
        <span className="font-mono text-[10px] text-ink-faint">·</span>
        <span className="font-mono text-[10px] text-ink-faint">
          {charCount.toLocaleString()} char{charCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
