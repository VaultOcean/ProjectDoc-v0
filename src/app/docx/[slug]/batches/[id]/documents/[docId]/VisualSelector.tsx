"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MousePointerClick, Loader2, Eraser, ArrowUp } from "lucide-react";

interface LayoutItem {
  x: number;
  y: number;
  w: number;
  h: number;
  str: string;
}
interface LayoutPage {
  width: number;
  height: number;
  items: LayoutItem[];
}

const TARGET_WIDTH = 560; // px the page is scaled to fit

export default function VisualSelector({
  docId,
  onAdd,
}: {
  docId: string;
  onAdd: (name: string, value: string) => boolean;
}) {
  const [pages, setPages] = useState<LayoutPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected item keys: "pageIndex:itemIndex"
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [colName, setColName] = useState("");

  // Drag box state (in scaled px, relative to the page being dragged)
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

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/docx/documents/${docId}/layout`);
        if (!res.ok) throw new Error("Failed to load layout");
        const data = await res.json();
        if (active) setPages(data.pages || []);
      } catch (e) {
        if (active) setError("Could not load visual preview.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [docId]);

  // Compose the selected text in reading order (top-to-bottom, left-to-right).
  const selectedText = useMemo(() => {
    const chosen: LayoutItem[] = [];
    selected.forEach((key) => {
      const [pi, ii] = key.split(":").map(Number);
      const item = pages[pi]?.items[ii];
      if (item) chosen.push(item);
    });
    chosen.sort((a, b) =>
      Math.abs(a.y - b.y) > 4 ? a.y - b.y : a.x - b.x
    );
    return chosen.map((c) => c.str).join(" ").replace(/\s+/g, " ").trim();
  }, [selected, pages]);

  const scaleFor = (p: LayoutPage) => TARGET_WIDTH / p.width;

  const toggleItem = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const handleAdd = () => {
    if (!colName.trim()) {
      alert("Type a column name first.");
      return;
    }
    if (!selectedText) {
      alert("Click or drag over the document to capture a value.");
      return;
    }
    const ok = onAdd(colName.trim(), selectedText);
    if (ok) {
      setColName("");
      clearSelection();
    } else {
      alert("That column already exists.");
    }
  };

  // ---- drag-to-box selection ----
  const onMouseDown = (e: React.MouseEvent, pi: number) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current = {
      page: pi,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      moved: false,
    };
  };

  const onMouseMove = (e: React.MouseEvent, pi: number) => {
    const d = dragRef.current;
    if (!d || d.page !== pi) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
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

  const onMouseUp = (pi: number) => {
    const d = dragRef.current;
    dragRef.current = null;
    const box = dragRect;
    setDragRect(null);
    if (!d || !d.moved || !box || box.page !== pi) return;

    const p = pages[pi];
    const scale = scaleFor(p);
    const additions = new Set<string>();
    p.items.forEach((it, ii) => {
      const ix = it.x * scale;
      const iy = it.y * scale;
      const iw = it.w * scale;
      const ih = it.h * scale;
      const intersects =
        ix < box.x + box.w &&
        ix + iw > box.x &&
        iy < box.y + box.h &&
        iy + ih > box.y;
      if (intersects) additions.add(`${pi}:${ii}`);
    });
    if (additions.size > 0) {
      setSelected((prev) => new Set([...prev, ...additions]));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading visual preview…</span>
      </div>
    );
  }

  if (error || pages.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-zinc-500">
        {error || "No visual layout available for this file."}
      </div>
    );
  }

  return (
    <div>
      {/* Capture panel */}
      <div className="mb-4 rounded-lg border border-zinc-700 bg-zinc-950 p-3">
        <div className="flex items-center gap-2 mb-2 text-xs text-zinc-400">
          <MousePointerClick className="h-3.5 w-3.5 text-tide" />
          Click words or drag a box on the document to capture exact text.
        </div>
        <div className="flex flex-col gap-2">
          <input
            value={colName}
            onChange={(e) => setColName(e.target.value)}
            placeholder="Column name (e.g. Order No)"
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-tide focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <div className="rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 min-h-[2.25rem]">
            {selectedText || (
              <span className="text-zinc-600">Captured value appears here…</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 rounded-lg bg-tide px-3 py-2 text-sm font-semibold text-black transition hover:bg-tide/90"
            >
              <ArrowUp className="inline h-3.5 w-3.5 mr-1" />
              Add as Column
            </button>
            <button
              onClick={clearSelection}
              disabled={selected.size === 0}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-40"
            >
              <Eraser className="inline h-3.5 w-3.5 mr-1" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Pages */}
      <div className="space-y-6 max-h-[34rem] overflow-auto rounded-lg border border-zinc-800 bg-zinc-800/40 p-4">
        {pages.map((p, pi) => {
          const scale = scaleFor(p);
          return (
            <div
              key={pi}
              className="relative mx-auto bg-white shadow-lg select-none"
              style={{
                width: p.width * scale,
                height: p.height * scale,
                cursor: "crosshair",
              }}
              onMouseDown={(e) => onMouseDown(e, pi)}
              onMouseMove={(e) => onMouseMove(e, pi)}
              onMouseUp={() => onMouseUp(pi)}
              onMouseLeave={() => onMouseUp(pi)}
            >
              {p.items.map((it, ii) => {
                const key = `${pi}:${ii}`;
                const isSel = selected.has(key);
                return (
                  <span
                    key={ii}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!dragRef.current?.moved) toggleItem(key);
                    }}
                    className={`absolute leading-none whitespace-nowrap rounded-sm transition-colors ${
                      isSel
                        ? "bg-tide/40 ring-1 ring-tide text-black"
                        : "hover:bg-tide/15 text-zinc-900"
                    }`}
                    style={{
                      left: it.x * scale,
                      top: it.y * scale,
                      height: it.h * scale,
                      fontSize: Math.max(it.h * scale * 0.86, 6),
                      cursor: "pointer",
                    }}
                    title={it.str}
                  >
                    {it.str}
                  </span>
                );
              })}

              {/* drag rectangle */}
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
          );
        })}
      </div>
      <p className="mt-2 text-xs text-zinc-600">
        Tip: click several words to build a multi-word value, or drag a box
        around a region (e.g. an address or a total).
      </p>
    </div>
  );
}
