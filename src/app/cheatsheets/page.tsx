"use client";

import { useState, useMemo } from "react";
import { Copy, Check, Search, Terminal } from "lucide-react";
import { CHEATSHEETS, CHEATSHEET_TOOLS } from "@/lib/cheatsheet-data";
import { cn } from "@/lib/cn";

export default function CheatsheetsPage() {
  const [activeTool, setActiveTool] = useState(CHEATSHEET_TOOLS[0]?.key ?? "nmap");
  const [query, setQuery]   = useState("");
  const [copied, setCopied] = useState<string | null>(null);

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
      return CHEATSHEETS.filter((c) =>
        c.title.toLowerCase().includes(q) ||
        c.command.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q) ||
        c.tool.toLowerCase().includes(q) ||
        c.tags.some((t) => t.includes(q))
      );
    }
    return CHEATSHEETS.filter((c) => c.tool === activeTool);
  }, [activeTool, query, isSearching]);

  const activeTool_ = CHEATSHEET_TOOLS.find((t) => t.key === activeTool);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">

      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Cheatsheets</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {CHEATSHEETS.length} commands · {CHEATSHEET_TOOLS.length} tools. Every flag you need, one place.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search commands, flags, tools…"
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

        {/* LEFT — tool nav (hidden while searching) */}
        {!isSearching && (
          <div className="w-44 shrink-0">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Tools
            </p>
            <div className="space-y-0.5">
              {CHEATSHEET_TOOLS.map((tool) => {
                const count   = CHEATSHEETS.filter((c) => c.tool === tool.key).length;
                const isActive = activeTool === tool.key;
                return (
                  <button
                    key={tool.key}
                    onClick={() => setActiveTool(tool.key)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                      isActive
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
                    )}
                  >
                    <Terminal className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-tide" : "text-zinc-600")} />
                    <span className="flex-1 truncate font-medium">{tool.label}</span>
                    <span className={cn("font-mono text-[10px]", isActive ? "text-zinc-400" : "text-zinc-700")}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* RIGHT — command list */}
        <div className="min-w-0 flex-1">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {isSearching
                ? `${displayed.length} result${displayed.length !== 1 ? "s" : ""} for "${query}"`
                : `${displayed.length} commands · ${activeTool_?.label}`}
            </p>
          </div>

          {displayed.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-700 p-10 text-center">
              <p className="text-sm text-zinc-500">No commands match your search.</p>
              <button onClick={() => setQuery("")} className="mt-2 text-xs text-tide hover:underline">
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {displayed.map((c) => (
                <div
                  key={c.id}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {isSearching && (
                          <span className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                            {c.tool}
                          </span>
                        )}
                        <span className="text-sm font-medium text-zinc-200">{c.title}</span>
                      </div>
                      <pre className="mb-2 overflow-x-auto rounded-lg bg-zinc-950 px-3 py-2.5 font-mono text-xs text-tide whitespace-pre-wrap">
                        {c.command}
                      </pre>
                      <p className="text-xs leading-relaxed text-zinc-600">{c.desc}</p>
                      {c.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {c.tags.map((t) => (
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
                    <button
                      onClick={() => copy(c.command, c.id)}
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                        copied === c.id
                          ? "border-green-800/60 bg-green-950/30 text-green-400"
                          : "border-zinc-700 text-zinc-500 hover:border-tide/40 hover:text-tide"
                      )}
                    >
                      {copied === c.id
                        ? <><Check className="h-3.5 w-3.5" /> Copied</>
                        : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
