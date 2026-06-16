"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { GraphNode, GraphEdge } from "@/app/api/graph/route";

/* ── Visual config ───────────────────────────────────────────────────────── */
const NODE_CFG = {
  doc:    { fill: "#2ee6d6", glow: "rgba(46,230,214,0.5)",   r: 8,  stroke: "#2ee6d6" },
  report: { fill: "#f97316", glow: "rgba(249,115,22,0.5)",   r: 7,  stroke: "#f97316" },
  target: { fill: "#4ade80", glow: "rgba(74,222,128,0.5)",   r: 10, stroke: "#4ade80" },
} as const;

const LEGEND = [
  { type: "target", label: "Engagements" },
  { type: "report", label: "Reports" },
  { type: "doc",    label: "Notes" },
] as const;

/* ── Force constants ─────────────────────────────────────────────────────── */
const REPULSION   = 3500;
const SPRING_REST = 130;
const SPRING_K    = 0.06;
const DAMPING     = 0.86;
const GRAVITY     = 0.018;
const TICK_MS     = 1000 / 60;

/* ── Internal sim node ───────────────────────────────────────────────────── */
type SimNode = GraphNode & { x: number; y: number; vx: number; vy: number };

function initSim(nodes: GraphNode[], w: number, h: number): SimNode[] {
  return nodes.map((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2;
    const radius = Math.min(w, h) * 0.3;
    return {
      ...n,
      x: w / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
      y: h / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
      vx: 0,
      vy: 0,
    };
  });
}

function tick(nodes: SimNode[], edges: GraphEdge[], w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;

  // Reset forces
  for (const n of nodes) {
    n.vx *= DAMPING;
    n.vy *= DAMPING;
  }

  // Repulsion between all pairs
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = REPULSION / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx -= fx;
      a.vy -= fy;
      b.vx += fx;
      b.vy += fy;
    }
  }

  // Spring attraction along edges
  const idxMap = new Map(nodes.map((n, i) => [n.id, i]));
  for (const e of edges) {
    const ai = idxMap.get(e.source);
    const bi = idxMap.get(e.target);
    if (ai === undefined || bi === undefined) continue;
    const a = nodes[ai];
    const b = nodes[bi];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const stretch = dist - SPRING_REST;
    const force = SPRING_K * stretch;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  }

  // Center gravity
  for (const n of nodes) {
    n.vx += (cx - n.x) * GRAVITY;
    n.vy += (cy - n.y) * GRAVITY;
    n.x += n.vx;
    n.y += n.vy;
    // Soft boundary
    const pad = 30;
    if (n.x < pad)     { n.x = pad;     n.vx *= -0.3; }
    if (n.x > w - pad) { n.x = w - pad; n.vx *= -0.3; }
    if (n.y < pad)     { n.y = pad;     n.vy *= -0.3; }
    if (n.y > h - pad) { n.y = h - pad; n.vy *= -0.3; }
  }
}

/* ── Main component ──────────────────────────────────────────────────────── */
export function KnowledgeGraph({
  nodes: rawNodes,
  edges,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const router  = useRouter();
  const svgRef  = useRef<SVGSVGElement>(null);
  const simRef  = useRef<SimNode[]>([]);
  const rafRef  = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const [rendered, setRendered] = useState(0); // bump to trigger re-render
  const [dims, setDims]         = useState({ w: 900, h: 600 });
  const [hovered, setHovered]   = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [tooltip, setTooltip]   = useState<{ x: number; y: number; node: SimNode } | null>(null);

  // Pan/zoom state
  const [pan,  setPan]  = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const panStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const draggingNode = useRef<{ id: string; ox: number; oy: number } | null>(null);

  // Observe container size
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setDims({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Init sim when nodes/dims change
  useEffect(() => {
    if (rawNodes.length === 0) return;
    simRef.current = initSim(rawNodes, dims.w, dims.h);
  }, [rawNodes, dims.w, dims.h]);

  // Run simulation
  useEffect(() => {
    let running = true;
    function loop(ts: number) {
      if (!running) return;
      if (ts - lastRef.current >= TICK_MS) {
        lastRef.current = ts;
        tick(simRef.current, edges, dims.w, dims.h);
        setRendered((r) => r + 1);
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    // Cool down after 8s — still redraws on hover/drag
    const cooldown = setTimeout(() => { running = false; }, 8000);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(cooldown);
    };
  }, [edges, dims]);

  // Restart sim on interaction
  const restartSim = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    let frame = 0;
    function loop(ts: number) {
      if (frame++ > 300) return;
      tick(simRef.current, edges, dims.w, dims.h);
      setRendered((r) => r + 1);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [edges, dims]);

  // ── Event handlers ───────────────────────────────────────────────
  function toSvgCoords(mx: number, my: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { sx: 0, sy: 0 };
    return {
      sx: (mx - rect.left - pan.x) / zoom,
      sy: (my - rect.top  - pan.y) / zoom,
    };
  }

  function onMouseDown(e: React.MouseEvent) {
    if ((e.target as SVGElement).closest("[data-node]")) return; // handled by node
    panStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (draggingNode.current) {
      const { sx, sy } = toSvgCoords(e.clientX, e.clientY);
      const n = simRef.current.find((n) => n.id === draggingNode.current!.id);
      if (n) { n.x = sx; n.y = sy; n.vx = 0; n.vy = 0; }
      restartSim();
      return;
    }
    if (panStart.current) {
      const dx = e.clientX - panStart.current.mx;
      const dy = e.clientY - panStart.current.my;
      setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
    }
  }

  function onMouseUp() {
    panStart.current = null;
    draggingNode.current = null;
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(3, Math.max(0.2, z * delta)));
  }

  // ── Derived sets for highlighting ───────────────────────────────
  const connectedIds = (() => {
    if (!hovered && !selected) return new Set<string>();
    const pivot = hovered ?? selected!;
    const ids = new Set<string>([pivot]);
    for (const e of edges) {
      if (e.source === pivot) ids.add(e.target);
      if (e.target === pivot) ids.add(e.source);
    }
    return ids;
  })();

  const sim = simRef.current;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-zinc-800 bg-[#080810]">
      {/* Legend */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/80 px-3 py-2 backdrop-blur-sm">
        {LEGEND.map(({ type, label }) => {
          const cfg = NODE_CFG[type];
          return (
            <div key={type} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: cfg.fill }} />
              <span className="font-mono text-[10px] text-zinc-400">{label}</span>
            </div>
          );
        })}
        <div className="mt-1 border-t border-zinc-800 pt-1">
          <span className="font-mono text-[9px] text-zinc-600">{rawNodes.length} nodes · {edges.length} edges</span>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
        {[{ label: "+", fn: () => setZoom((z) => Math.min(3, z * 1.2)) }, { label: "−", fn: () => setZoom((z) => Math.max(0.2, z / 1.2)) }, { label: "⟲", fn: () => { setPan({ x: 0, y: 0 }); setZoom(1); } }].map(({ label, fn }) => (
          <button key={label} onClick={fn}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900/80 font-mono text-sm text-zinc-400 hover:border-tide/50 hover:text-tide transition-colors">
            {label}
          </button>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg border border-zinc-700 bg-zinc-900/95 px-3 py-2 shadow-2xl backdrop-blur-sm"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          <p className="font-mono text-[11px] font-semibold text-zinc-100">{tooltip.node.label}</p>
          {tooltip.node.detail && (
            <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">{tooltip.node.detail}</p>
          )}
          <p className="mt-0.5 font-mono text-[9px] text-zinc-600 capitalize">{tooltip.node.type}</p>
        </div>
      )}

      {/* Empty state */}
      {rawNodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
          <div className="h-16 w-16 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center">
            <span className="font-mono text-2xl text-zinc-600">∅</span>
          </div>
          <p className="font-mono text-sm text-zinc-500">No nodes yet</p>
          <p className="max-w-xs font-mono text-[11px] text-zinc-700">
            Create notes, reports, and engagements — they appear here as a connected graph.
            Use <span className="text-tide">[[title]]</span> in notes to create links.
          </p>
        </div>
      )}

      {/* SVG canvas */}
      <svg
        ref={svgRef}
        className="h-full w-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <defs>
          {/* Glow filters per type */}
          {(["doc", "report", "target"] as const).map((type) => (
            <filter key={type} id={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="rgba(255,255,255,0.12)" />
          </marker>
        </defs>

        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {edges.map((e, i) => {
            const src = sim.find((n) => n.id === e.source);
            const tgt = sim.find((n) => n.id === e.target);
            if (!src || !tgt) return null;
            const isHighlighted = connectedIds.has(e.source) && connectedIds.has(e.target);
            return (
              <line
                key={i}
                x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={isHighlighted ? "rgba(46,230,214,0.5)" : "rgba(255,255,255,0.06)"}
                strokeWidth={isHighlighted ? 1.5 : 1}
                strokeDasharray={e.kind === "wikilink" ? "4 3" : undefined}
                markerEnd={e.kind === "fk" ? "url(#arrowhead)" : undefined}
                className="transition-all duration-150"
              />
            );
          })}

          {/* Nodes */}
          {sim.map((n) => {
            const cfg = NODE_CFG[n.type];
            const isHov = hovered === n.id || selected === n.id;
            const isDim = (connectedIds.size > 0) && !connectedIds.has(n.id);
            return (
              <g
                key={n.id}
                data-node="1"
                transform={`translate(${n.x},${n.y})`}
                className="cursor-pointer"
                onMouseEnter={(e) => {
                  setHovered(n.id);
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (rect) {
                    setTooltip({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      node: n,
                    });
                  }
                }}
                onMouseLeave={() => { setHovered(null); setTooltip(null); }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  draggingNode.current = { id: n.id, ox: n.x, oy: n.y };
                }}
                onClick={() => {
                  if (draggingNode.current) return;
                  setSelected(selected === n.id ? null : n.id);
                }}
                onDoubleClick={() => router.push(n.href)}
                style={{ opacity: isDim ? 0.2 : 1, transition: "opacity 0.15s" }}
              >
                {/* Outer glow ring when hovered */}
                {isHov && (
                  <circle r={cfg.r + 6} fill="none" stroke={cfg.fill} strokeWidth={1} opacity={0.3} />
                )}
                {/* Node circle */}
                <circle
                  r={cfg.r}
                  fill={cfg.fill}
                  opacity={isHov ? 1 : 0.85}
                  filter={isHov ? `url(#glow-${n.type})` : undefined}
                />
                {/* Label */}
                <text
                  y={cfg.r + 11}
                  textAnchor="middle"
                  fontSize={9}
                  fontFamily="monospace"
                  fill={isHov ? "#ffffff" : "rgba(255,255,255,0.55)"}
                  className="transition-all duration-100"
                >
                  {n.label.length > 20 ? n.label.slice(0, 18) + "…" : n.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Selected node action bar */}
      {selected && (() => {
        const n = sim.find((n) => n.id === selected);
        if (!n) return null;
        return (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900/95 px-4 py-2.5 shadow-2xl backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full" style={{ background: NODE_CFG[n.type].fill }} />
            <span className="font-mono text-sm text-zinc-100">{n.label}</span>
            <span className="font-mono text-[10px] text-zinc-500 capitalize">{n.type}</span>
            <button
              onClick={() => router.push(n.href)}
              className="ml-2 rounded-md border border-tide/30 bg-tide/10 px-3 py-1 font-mono text-[11px] text-tide hover:bg-tide/20 transition-colors"
            >
              Open →
            </button>
            <button onClick={() => setSelected(null)} className="font-mono text-[11px] text-zinc-600 hover:text-zinc-400">✕</button>
          </div>
        );
      })()}
    </div>
  );
}
