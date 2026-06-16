"use client";

import { useState, useMemo } from "react";
import {
  Lock, Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp,
  Download, X, AlertCircle, Check, Copy, Check as CheckIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface Field {
  id: string;
  name: string;
  value: string;
  dataType: string;
  encrypted: boolean;
  required: boolean;
  isPii: boolean;
  position: number;
}

const DATA_TYPES = [
  "text", "email", "url", "ip", "phone", "date", "number",
  "currency", "boolean", "json", "ssn", "ccn",
];

const PII_PATTERNS: Record<string, RegExp> = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/,
  ccn: /\b(?:\d{4}[-\s]?){3}\d{4}\b/,
};

export function DocxWorkspace({
  session,
  initialFields,
}: {
  session: { id: string; name: string; rawText: string; status: string };
  initialFields: Field[];
}) {
  const [fields, setFields] = useState(initialFields);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newField, setNewField] = useState({ name: "", dataType: "text" });
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [showTable, setShowTable] = useState(true);
  const [copied, setCopied] = useState("");

  /* Auto-detect if value matches PII pattern */
  function detectPii(value: string): boolean {
    for (const [_, pattern] of Object.entries(PII_PATTERNS)) {
      if (pattern.test(value)) return true;
    }
    return false;
  }

  /* Auto-detect data type */
  function inferType(value: string): string {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email";
    if (/^https?:\/\//.test(value)) return "url";
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) return "ip";
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return "date";
    if (/^-?\d+\.?\d*$/.test(value)) return "number";
    if (value.toLowerCase() === "true" || value.toLowerCase() === "false") return "boolean";
    return "text";
  }

  function addField() {
    if (!newField.name.trim()) return;
    const field: Field = {
      id: Math.random().toString(36).slice(2),
      name: newField.name,
      value: "",
      dataType: newField.dataType,
      encrypted: false,
      required: false,
      isPii: false,
      position: fields.length,
    };
    setFields([...fields, field]);
    setNewField({ name: "", dataType: "text" });
  }

  function updateField(id: string, updates: Partial<Field>) {
    setFields((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              ...updates,
              isPii: updates.value ? detectPii(updates.value) : f.isPii,
            }
          : f
      )
    );
  }

  function deleteField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }

  function toggleReveal(id: string) {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function exportCSV() {
    const header = fields.map((f) => `"${f.name}"`).join(",");
    const row = fields
      .map((f) => {
        let val = f.value;
        if (f.encrypted && !revealedIds.has(f.id)) val = "[ENCRYPTED]";
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(",");
    const csv = `${header}\n${row}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.name}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportJSON() {
    const obj: Record<string, string> = {};
    fields.forEach((f) => {
      let val = f.value;
      if (f.encrypted && !revealedIds.has(f.id)) val = "[ENCRYPTED]";
      obj[f.name] = val;
    });
    const json = JSON.stringify(obj, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.name}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const encryptedCount = useMemo(() => fields.filter((f) => f.encrypted).length, [fields]);
  const piiCount = useMemo(() => fields.filter((f) => f.isPii).length, [fields]);

  return (
    <div className="space-y-6">

      {/* Split-pane: preview + mapper */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Left: Preview */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h2 className="font-semibold text-zinc-100">Preview</h2>
            <p className="mt-0.5 text-xs text-zinc-600">{session.rawText.split(/\s+/).length} words</p>
          </div>
          <div className="max-h-[400px] overflow-y-auto scrollbar-none p-4">
            <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-400">
              {session.rawText || "No text extracted yet"}
            </pre>
          </div>
        </div>

        {/* Right: Field mapper */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h2 className="font-semibold text-zinc-100">
              Fields ({fields.length})
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              {encryptedCount} encrypted · {piiCount} PII flagged
            </p>
          </div>

          <div className="max-h-[400px] overflow-y-auto scrollbar-none space-y-2 p-4">
            {fields.map((field) => (
              <div
                key={field.id}
                className="rounded-lg border border-zinc-700/60 bg-zinc-900/40 p-3 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField(field.id, { name: e.target.value })}
                    placeholder="Field name"
                    className="flex-1 min-w-0 bg-transparent font-mono text-xs text-zinc-200 outline-none placeholder:text-zinc-600"
                  />
                  <button
                    onClick={() => deleteField(field.id)}
                    className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <input
                  type="text"
                  value={field.value}
                  onChange={(e) =>
                    updateField(field.id, {
                      value: e.target.value,
                      dataType: inferType(e.target.value),
                    })
                  }
                  placeholder="Value"
                  className="w-full bg-transparent font-mono text-xs text-zinc-300 outline-none placeholder:text-zinc-600"
                />

                <div className="flex gap-2 flex-wrap items-center">
                  <select
                    value={field.dataType}
                    onChange={(e) => updateField(field.id, { dataType: e.target.value })}
                    className="bg-zinc-800/60 border border-zinc-700 rounded text-[11px] text-zinc-300 outline-none px-2 py-1"
                  >
                    {DATA_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  <button
                    onClick={() =>
                      updateField(field.id, { encrypted: !field.encrypted })
                    }
                    className={cn(
                      "flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors",
                      field.encrypted
                        ? "bg-amber-950/40 text-amber-400 border border-amber-900/50"
                        : "bg-zinc-800/60 text-zinc-600 border border-zinc-700"
                    )}
                  >
                    <Lock className="h-3 w-3" />
                    Encrypt
                  </button>

                  {field.isPii && (
                    <span className="rounded px-2 py-1 bg-red-950/40 text-red-400 text-[10px] font-semibold uppercase">
                      PII
                    </span>
                  )}

                  {field.encrypted && (
                    <button
                      onClick={() => toggleReveal(field.id)}
                      className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      {revealedIds.has(field.id)
                        ? <><Eye className="h-3 w-3" /> Hide</>
                        : <><EyeOff className="h-3 w-3" /> Show</>}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add field */}
            <div className="space-y-2">
              <input
                type="text"
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addField()}
                placeholder="New field name…"
                className="w-full bg-zinc-800/40 border border-dashed border-zinc-700 rounded-lg px-3 py-2 font-mono text-xs text-zinc-300 outline-none placeholder:text-zinc-600 focus:border-tide/40 transition-colors"
              />
              <button
                onClick={addField}
                disabled={!newField.name.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-tide/10 border border-tide/40 px-3 py-2 font-mono text-xs font-semibold text-tide hover:bg-tide/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add field
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table / Export section */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <button
            onClick={() => setShowTable(!showTable)}
            className="flex items-center gap-2 font-semibold text-zinc-100 hover:text-tide transition-colors"
          >
            {showTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Table view
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              disabled={fields.length === 0}
              className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
            <button
              onClick={exportJSON}
              disabled={fields.length === 0}
              className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              JSON
            </button>
          </div>
        </div>

        {showTable && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/50">
                  {fields.map((f) => (
                    <th key={f.id} className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                          {f.name}
                        </span>
                        {f.encrypted && <Lock className="h-3 w-3 text-amber-500/60" />}
                        {f.isPii && <AlertCircle className="h-3 w-3 text-red-500/60" />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-800/40">
                  {fields.map((f) => {
                    const isRevealed = revealedIds.has(f.id);
                    let display = f.value;
                    if (f.encrypted && !isRevealed) display = "●●●●●";
                    return (
                      <td key={f.id} className="px-4 py-3 text-xs text-zinc-300">
                        {display}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
