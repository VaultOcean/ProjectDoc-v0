"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  MousePointerClick,
  Loader2,
  Eraser,
  Plus,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  pairAtPoint,
  type PositionedPage,
  type PositionedItem,
} from "@/lib/smart-fields";

export default function VisualSelector({
  pages,
  loading,
  error,
  onAdd,
}: {
  pages: PositionedPage[];
  loading: boolean;
  error: string | null;
  onAdd: (name: string, value: string) => boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [colName, setColName] = useState("");
  const [valueOverride, setValueOverride] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // Responsive base scale: fit the widest page to the container.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(540);
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setContainerW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxPageW = useMemo(
    () => Math.max(1, ...pages.map((p) => p.width)),
    [pages]
  );
  const baseScale = containerW / maxPageW;
  const scale = baseScale * zoom;

  const key = (pi: number, ii: number) => `${pi}:${ii}`;

  // Compose the selected text in reading order (top→bottom, left→right).
  const selectionText = useMemo(() => {
    const chosen: PositionedItem[] = [];
    selected.forEach((k) => {
      const [pi, ii] = k.split(":").map(Number);
      const it = pages[pi]?.items[ii];
      if (it) chosen.push(it);
    });
    chosen.sort((a, b) => (Math.abs(a.y - b.y) > 4 ? a.y - b.y : a.x - b.x));
    return chosen.map((c) => c.str).join(" ").replace(/\s+/g, " ").trim();
  }, [selected, pages]);

  const value = valueOverride ?? selectionText;

  // ---- single click: smart-pair the word into name + value ----
  const handleWordClick = (pi: number, ii: number, additive: boolean) => {
    if (additive) {
      // Shift/Ctrl-click extends the current value selection.
      setValueOverride(null);
      setSelected((prev) => {
        const next = new Set(prev);
        const k = key(pi, ii);
        next.has(k) ? next.delete(k) : next.add(k);
        return next;
      });
      return;
    }
    const pair = pairAtPoint(pages[pi], ii);
    if (pair) {
      setColName(pair.name);
      setValueOverride(null);
      setSelected(new Set(pair.keys.map((kk) => key(pi, kk))));
    } else {
      // No label found — just capture this single word as the value.
      const it = pages[pi].items[ii];
      setValueOverride(null);
      setSelected(new Set([key(pi, ii)]));
      if (!colName) setColName("");
      void it;
    }
  };

  const clearSelection = () => {
    setSelected(new Set());
    setValueOverride(null);
    setColName("");
  };

  const handleAdd = () => {
    if (!colName.trim()) return alert("Type or pick a column name first.");
    if (!value.trim())
      return alert("Click a word (or drag a box) to capture a value.");
    if (onAdd(colName.trim(), value.trim())) {
      clearSelection();
    } else {
      alert("That column already exists.");
    }
  };

  // ---- drag rubber-band selection ----
  const dragRef = useRef<{
    page: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const [dragRect, setDragRect] = useState<{
    page: number;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  const onDown = (e: React.MouseEvent, pi: number) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current = {
      page: pi,
      startX: e.clientX - r.left,
      startY: e.clientY - r.top,
      moved: false,
    };
  };
  const onMove = (e: React.MouseEvent, pi: number) => {
    const d = dragRef.current;
    if (!d || d.page !== pi) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    if (Math.abs(cx - d.startX) > 4 || Math.abs(cy - d.startY) > 4) {
      d.moved = true;
      setDragRect({
        page: pi,
        x: Math.min(cx, d.startX),
        y: Math.min(cy, d.startY),
        w: Math.abs(cx - d.startX),
        h: Math.abs(cy - d.startY),
      });
    }
  };
  const onUp = (pi: number) => {
    const d = dragRef.current;
    const box = dragRect;
    dragRef.current = null;
    setDragRect(null);
    if (!d || !d.moved || !box || box.page !== pi) return;
    const p = pages[pi];
    const adds = new Set<string>();
    p.items.forEach((it, ii) => {
      const ix = it.x * scale;
      const iy = it.y * scale;
      const iw = it.w * scale;
      const ih = it.h * scale;
      if (
        ix < box.x + box.w &&
        ix + iw > box.x &&
        iy < box.y + box.h &&
        iy + ih > box.y
      )
        adds.add(key(pi, ii));
    });
    if (adds.size > 0) {
      setValueOverride(null);
      setSelected(adds);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Rendering document…</span>
      </div>
    );
  }
  if (error || pages.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-zinc-500">
        {error || "No visual layout for this file (it may be a scanned image)."}
      </div>
    );
  }

  return (
    <div>
      {/* Capture panel */}
      <div className="mb-3 rounded-lg border border-zinc-700 bg-zinc-950 p-3">
        <div className="flex items-center gap-2 mb-2 text-xs text-zinc-400">
          <MousePointerClick className="h-3.5 w-3.5 text-tide" />
          Click a value and its column name is detected automatically.
          Shift-click to add more words; drag a box for a region.
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
              Column name
            </label>
            <input
              value={colName}
              onChange={(e) => setColName(e.target.value)}
              placeholder="e.g. Order No"
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-tide focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 mb-1">
              Value
            </label>
            <input
              value={value}
              onChange={(e) => setValueOverride(e.target.value)}
              placeholder="click the document →"
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-tide focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleAdd}
            className="flex-1 rounded-lg bg-tide px-3 py-1.5 text-sm font-semibold text-black transition hover:bg-tide/90"
          >
            <Plus className="inline h-3.5 w-3.5 mr-1" />
            Add Column
          </button>
          <button
            onClick={clearSelection}
            disabled={selected.size === 0 && !colName}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-40"
          >
            <Eraser className="inline h-3.5 w-3.5 mr-1" />
            Clear
          </button>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center justify-end gap-1 mb-2">
        <button
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
          className="rounded border border-zinc-700 bg-zinc-900 p-1 text-zinc-400 hover:bg-zinc-800"
          title="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs text-zinc-500 w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
          className="rounded border border-zinc-700 bg-zinc-900 p-1 text-zinc-400 hover:bg-zinc-800"
          title="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Pages */}
      <div
        ref={wrapRef}
        className="max-h-[34rem] overflow-auto rounded-lg border border-zinc-800 bg-zinc-800/40 p-3"
      >
        <div className="space-y-6">
          {pages.map((p, pi) => (
            <div
              key={pi}
              className="relative mx-auto bg-white shadow-lg select-none"
              style={{
                width: p.width * scale,
                height: p.height * scale,
                cursor: "crosshair",
              }}
              onMouseDown={(e) => onDown(e, pi)}
              onMouseMove={(e) => onMove(e, pi)}
              onMouseUp={() => onUp(pi)}
              onMouseLeave={() => onUp(pi)}
            >
              {p.items.map((it, ii) => {
                const k = key(pi, ii);
                const isSel = selected.has(k);
                return (
                  <span
                    key={ii}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (dragRef.current?.moved) return;
                      handleWordClick(pi, ii, e.shiftKey || e.ctrlKey);
                    }}
                    className={`absolute leading-none whitespace-nowrap rounded-[2px] transition-colors ${
                      isSel
                        ? "bg-tide/50 ring-1 ring-tide text-black"
                        : "text-zinc-900 hover:bg-amber-200/60"
                    }`}
                    style={{
                      left: it.x * scale,
                      top: it.y * scale,
                      height: it.h * scale,
                      fontSize: Math.max(it.h * scale * 0.88, 5),
                      cursor: "pointer",
                    }}
                    title={it.str}
                  >
                    {it.str}
                  </span>
                );
              })}
              {dragRect && dragRect.page === pi && (
                <div
                  className="absolute border border-tide bg-tide/10 pointer-events-none"
                  style={{
                    left: dragRect.x,
                    top: dragRect.y,
                    width: dragRect.w,
                    height: dragRect.h,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-600">
        One click = smart capture (name + value). Shift-click adds words. Drag a
        box for an address or total. Everything stays editable above.
      </p>
    </div>
  );
}
