"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import type { GraphData } from "@/app/api/graph/route";

export default function GraphPage() {
  const router = useRouter();
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);

  async function load() {
    setLoading(true);
    const d = await fetch("/api/graph").then((r) => r.json()) as GraphData;
    setData(d);
    setLoading(false);
    setKey((k) => k + 1);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="flex h-screen flex-col bg-[#080810]">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-4 border-b border-zinc-800/60 px-5 py-3">
        <button
          onClick={() => router.push("/workspace")}
          className="flex items-center gap-1.5 font-mono text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Notes
        </button>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-tide animate-pulse" />
          <span className="font-mono text-[12px] font-semibold text-zinc-200">Knowledge Graph</span>
        </div>
        {data && (
          <span className="font-mono text-[10px] text-zinc-600">
            {data.nodes.length} nodes · {data.edges.length} connections
          </span>
        )}
        <button
          onClick={load}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 font-mono text-[11px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-40 transition-colors"
        >
          {loading
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <RefreshCw className="h-3 w-3" />}
          Refresh
        </button>
      </div>

      {/* Hints */}
      <div className="flex shrink-0 items-center gap-4 border-b border-zinc-800/40 bg-zinc-900/30 px-5 py-1.5">
        {[
          "scroll — zoom",
          "drag background — pan",
          "drag node — reposition",
          "click — select",
          "double-click — open",
          "[[title]] in notes — creates links",
        ].map((h) => (
          <span key={h} className="font-mono text-[9px] text-zinc-700">{h}</span>
        ))}
      </div>

      {/* Graph canvas */}
      <div className="flex-1 min-h-0 p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-zinc-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-mono text-[12px]">Building graph…</span>
          </div>
        ) : (
          <KnowledgeGraph
            key={key}
            nodes={data?.nodes ?? []}
            edges={data?.edges ?? []}
          />
        )}
      </div>
    </div>
  );
}
