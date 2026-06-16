"use client";

import { useState, useMemo } from "react";
import { Copy, Check, Search } from "lucide-react";
import { PAYLOADS, PAYLOAD_CATEGORIES, type PayloadEntry } from "@/lib/payload-data";
import { cn } from "@/lib/cn";

const CAT_COLORS: Record<string, { badge: string; dot: string }> = {
  xss:             { badge: "text-red-400 bg-red-400/10 border-red-400/20",       dot: "bg-red-400" },
  sqli:            { badge: "text-orange-400 bg-orange-400/10 border-orange-400/20", dot: "bg-orange-400" },
  ssrf:            { badge: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", dot: "bg-yellow-400" },
  idor:            { badge: "text-purple-400 bg-purple-400/10 border-purple-400/20", dot: "bg-purple-400" },
  lfi:             { badge: "text-blue-400 bg-blue-400/10 border-blue-400/20",     dot: "bg-blue-400" },
  ssti:            { badge: "text-pink-400 bg-pink-400/10 border-pink-400/20",     dot: "bg-pink-400" },
  xxe:             { badge: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",     dot: "bg-cyan-400" },
  "open-redirect": { badge: "text-green-400 bg-green-400/10 border-green-400/20", dot: "bg-green-400" },
  rce:             { badge: "text-red-500 bg-red-500/10 border-red-500/20",       dot: "bg-red-500" },
  csrf:            { badge: "text-amber-400 bg-amber-400/10 border-amber-400/20", dot: "bg-amber-400" },
  nosqli:          { badge: "text-lime-400 bg-lime-400/10 border-lime-400/20",    dot: "bg-lime-400" },
  jwt:             { badge: "text-violet-400 bg-violet-400/10 border-violet-400/20", dot: "bg-violet-400" },
};

export default function PayloadsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("xss");
  const [query, setQuery]       = useState("");
  const [copied, setCopied]     = useState<string | null>(null);

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  const isSearching = query.trim().length > 0;

  const displayed = useMemo(() => {
    if (isSearching) {
      const q = query.toLowerCase();
      return PAYLOADS.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.payload.toLowerCase().includes(q) ||
        p.context.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))
      );
    }
    return PAYLOADS.filter((p) => p.category === activeCategory);
  }, [activeCategory, query, isSearching]);

  const activeCat = PAYLOAD_CATEGORIES.find((c) => c.key === activeCategory);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">

      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Payload Library</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {PAYLOADS.length} payloads · {PAYLOAD_CATEGORIES.length} vulnerability classes. Click any to copy.
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search payloads, context, tags…"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-tide/60 transition-colors"
        />
        {isSearching && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Split pane */}
      <div className="flex gap-4">

        {/* LEFT — category nav (hidden while searching) */}
        {!isSearching && (
          <div className="w-44 shrink-0">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Categories
            </p>
            <div className="space-y-0.5">
              {PAYLOAD_CATEGORIES.map((cat) => {
                const count   = PAYLOADS.filter((p) => p.category === cat.key).length;
                const isActive = activeCategory === cat.key;
                const colors  = CAT_COLORS[cat.key];
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                      isActive
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", colors?.dot ?? "bg-zinc-500")} />
                    <span className="flex-1 truncate font-medium">{cat.label}</span>
                    <span className={cn("font-mono text-[10px]", isActive ? "text-zinc-400" : "text-zinc-700")}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* RIGHT — payload list */}
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {isSearching
                ? `${displayed.length} result${displayed.length !== 1 ? "s" : ""} for "${query}"`
                : `${displayed.length} payloads · ${activeCat?.label}`}
            </p>
          </div>

          {displayed.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-700 p-10 text-center">
              <p className="text-sm text-zinc-500">No payloads match your search.</p>
              <button onClick={() => setQuery("")} className="mt-2 text-xs text-tide hover:underline">
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {displayed.map((p: PayloadEntry) => {
                const colors = CAT_COLORS[p.category];
                return (
                  <div
                    key={p.id}
                    className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {isSearching && (
                          <span className={cn("rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase", colors?.badge ?? "border-zinc-700 text-zinc-400")}>
                            {p.category}
                          </span>
                        )}
                        <span className="text-sm font-medium text-zinc-200">{p.name}</span>
                      </div>
                      <button
                        onClick={() => copy(p.payload, p.id)}
                        className={cn(
                          "flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                          copied === p.id
                            ? "border-green-800/60 bg-green-950/30 text-green-400"
                            : "border-zinc-700 text-zinc-500 hover:border-tide/40 hover:text-tide"
                        )}
                      >
                        {copied === p.id
                          ? <><Check className="h-3.5 w-3.5" /> Copied</>
                          : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                      </button>
                    </div>

                    <pre className="mb-2 overflow-x-auto rounded-lg bg-zinc-950 px-3 py-2.5 font-mono text-xs text-zinc-300">
                      {p.payload}
                    </pre>

                    <p className="text-xs leading-relaxed text-zinc-600">{p.context}</p>

                    {p.tags.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {p.tags.map((t) => (
                          <button
                            key={t}
                            onClick={() => setQuery(t)}
                            className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 transition hover:bg-zinc-700 hover:text-zinc-300"
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
