"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Upload, FileText, Image as ImageIcon, FileJson, X, Loader2,
  ChevronUp, ChevronDown, ChevronsUpDown, Filter, Download,
  Table2, Eye, EyeOff, AlertTriangle, CheckCircle2, RotateCcw,
  Database, Cpu, Globe, ScanLine, Lock, LockOpen, ArrowRight,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/cn";

/* ── Types ─────────────────────────────────────────────────────────────────── */
type Mode   = "scope" | "nmap" | "shodan" | "custom";
type Status = "idle" | "reading" | "extracting" | "field-select" | "done" | "error";
type Row    = Record<string, string>;

interface Result { columns: string[]; records: Row[] }

interface FieldConfig {
  col:     string;
  include: boolean;
  encrypt: boolean;
}

/* ── Mode definitions ───────────────────────────────────────────────────────── */
const MODES: { key: Mode; label: string; desc: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "scope",   label: "Scope Parser",    Icon: Globe,    desc: "Bug bounty scope documents — extracts domains, IPs, bounty ranges, rules" },
  { key: "nmap",    label: "Nmap Parser",     Icon: ScanLine, desc: "Nmap XML/text output — extracts hosts, ports, services, versions, NSE scripts" },
  { key: "shodan",  label: "Shodan / Censys", Icon: Database, desc: "Shodan/Censys export JSON — extracts IPs, banners, CVEs, org metadata" },
  { key: "custom",  label: "Custom Fields",   Icon: Cpu,      desc: "Define your own extraction fields — your Eagle server maps them from any document" },
];

const ACCEPTED = ".txt,.xml,.json,.csv,.nmap,.gnmap,.md,.html,.png,.jpg,.jpeg,.webp,.pdf";

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
  if (mime.includes("json"))     return <FileJson className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function fmtBytes(n: number) {
  if (n < 1024)            return `${n} B`;
  if (n < 1024 * 1024)     return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Cell colouring ─────────────────────────────────────────────────────────── */
function CellValue({
  col, val, encrypted, revealed,
}: {
  col: string; val: string; encrypted?: boolean; revealed?: boolean;
}) {
  if (encrypted && !revealed) {
    return (
      <span className="select-none font-mono text-[11px] tracking-widest text-zinc-600">
        ●●●●●
      </span>
    );
  }
  if (!val) return <span className="text-zinc-700">—</span>;
  const colL = col.toLowerCase();

  if (colL === "in_scope" || colL === "inscope") {
    const v = val.toLowerCase();
    if (v === "yes" || v === "true" || v === "in-scope")
      return <span className="inline-flex items-center gap-1 rounded-full bg-green-950/60 px-2 py-0.5 font-mono text-[10px] text-green-400 ring-1 ring-green-900/60">{val}</span>;
    if (v === "no" || v === "false" || v === "out-of-scope" || v === "out of scope")
      return <span className="inline-flex items-center gap-1 rounded-full bg-red-950/60 px-2 py-0.5 font-mono text-[10px] text-red-400 ring-1 ring-red-900/60">{val}</span>;
  }
  if (colL === "state" || colL === "status") {
    const v = val.toLowerCase();
    if (v === "open")     return <span className="font-mono text-[11px] text-green-400">{val}</span>;
    if (v === "closed")   return <span className="font-mono text-[11px] text-red-400">{val}</span>;
    if (v === "filtered") return <span className="font-mono text-[11px] text-yellow-400">{val}</span>;
  }
  if (colL === "port")                        return <span className="font-mono text-[11px] text-cyan-400">{val}</span>;
  if (colL === "ip" || colL === "ip_range" || colL === "host") return <span className="font-mono text-[11px] text-blue-300">{val}</span>;
  if (colL === "domain" || colL === "hostname") return <span className="font-mono text-[11px] text-tide">{val}</span>;
  if (colL === "vulns" || colL === "cve")     return <span className="font-mono text-[10px] text-orange-400">{val}</span>;
  if (colL === "bounty_range" || colL === "bounty") return <span className="font-mono text-[11px] text-emerald-400">{val}</span>;

  return <span className="text-[12px] text-zinc-300">{val}</span>;
}

/* ── Export helpers ──────────────────────────────────────────────────────────── */
function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ── Main component ──────────────────────────────────────────────────────────── */
export function AssetScanner({ connectorStatus }: { connectorStatus?: string | null }) {
  const [file,         setFile]         = useState<File | null>(null);
  const [mode,         setMode]         = useState<Mode>("scope");
  const [customFields, setCustomFields] = useState("domain, ip, port, service, notes");
  const [status,       setStatus]       = useState<Status>("idle");
  const [error,        setError]        = useState("");

  /* Raw result from Eagle (unfiltered, unmasked) */
  const [rawResult,    setRawResult]    = useState<Result | null>(null);
  /* Field configuration set during field-select stage */
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);
  /* Final result shown in table (same records as rawResult, masking applied at render) */
  const [result,       setResult]       = useState<Result | null>(null);
  /* Columns whose encrypted values are temporarily revealed */
  const [revealedCols, setRevealedCols] = useState<Set<string>>(new Set());

  /* Table state */
  const [filter,      setFilter]      = useState("");
  const [sortCol,     setSortCol]     = useState<string | null>(null);
  const [sortDir,     setSortDir]     = useState<"asc" | "desc">("asc");
  const [hiddenCols,  setHiddenCols]  = useState<Set<string>>(new Set());
  const [colMenuOpen, setColMenuOpen] = useState(false);

  /* Drag state */
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Derived from fieldConfigs ── */
  const encryptedColsSet = useMemo(
    () => new Set(fieldConfigs.filter((fc) => fc.encrypt).map((fc) => fc.col)),
    [fieldConfigs]
  );
  const includedCols = useMemo(
    () => fieldConfigs.filter((fc) => fc.include).map((fc) => fc.col),
    [fieldConfigs]
  );

  /* ── Drag & drop ── */
  const onDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  const onDrop      = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function acceptFile(f: File) {
    setFile(f);
    setRawResult(null);
    setResult(null);
    setFieldConfigs([]);
    setError("");
    setStatus("idle");
  }

  /* ── Read file ── */
  function readFile(f: File): Promise<{ content: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const isImage = f.type.startsWith("image/");
      const reader  = new FileReader();
      reader.onerror = () => reject(new Error("File read failed"));
      if (isImage) {
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve({ content: dataUrl.split(",")[1] ?? dataUrl, mimeType: f.type });
        };
        reader.readAsDataURL(f);
      } else {
        reader.onload = () => resolve({ content: reader.result as string, mimeType: f.type || "text/plain" });
        reader.readAsText(f);
      }
    });
  }

  /* ── Extract → field-select ── */
  async function extract() {
    if (!file) return;
    setStatus("reading");
    setError("");
    setRawResult(null);
    setResult(null);

    let fileData: { content: string; mimeType: string };
    try {
      fileData = await readFile(file);
    } catch {
      setError("Could not read the file. Make sure it is text, JSON, XML, or an image.");
      setStatus("error");
      return;
    }

    setStatus("extracting");

    try {
      const res  = await fetch("/api/assets/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content:      fileData.content,
          mimeType:     fileData.mimeType,
          mode,
          customFields: mode === "custom" ? customFields : undefined,
        }),
      });
      const data = await res.json() as {
        ok: boolean; columns?: string[]; records?: Row[];
        error?: string; code?: string;
      };

      if (!data.ok) {
        const msg =
          data.code === "NO_CONNECTOR"
            ? "No Eagle server configured. Go to Settings → AssetxOcean Connector to register your server."
            : data.code === "NOT_ACTIVE"
            ? "Your Eagle server connector is not yet active. Check your connector settings."
            : (data.error ?? "Extraction failed");
        setError(msg);
        setStatus("error");
        return;
      }

      const columns = data.columns ?? [];
      const records = data.records ?? [];
      setRawResult({ columns, records });
      /* All columns included, none encrypted by default */
      setFieldConfigs(columns.map((col) => ({ col, include: true, encrypt: false })));
      setStatus("field-select");
    } catch {
      setError("Network error — check your connection and try again.");
      setStatus("error");
    }
  }

  /* ── Build table from field selection ── */
  function buildTable() {
    if (!rawResult) return;
    setResult(rawResult);
    setHiddenCols(new Set());
    setSortCol(null);
    setFilter("");
    setRevealedCols(new Set());
    setStatus("done");
  }

  /* ── Update a single field config ── */
  function toggleInclude(col: string) {
    setFieldConfigs((prev) =>
      prev.map((fc) => fc.col === col ? { ...fc, include: !fc.include } : fc)
    );
  }

  function toggleEncrypt(col: string) {
    setFieldConfigs((prev) =>
      prev.map((fc) => fc.col === col ? { ...fc, encrypt: !fc.encrypt } : fc)
    );
  }

  function setAllIncluded(val: boolean) {
    setFieldConfigs((prev) => prev.map((fc) => ({ ...fc, include: val })));
  }

  /* ── Table logic ── */
  const visibleCols = useMemo(
    () => includedCols.filter((c) => !hiddenCols.has(c)),
    [includedCols, hiddenCols]
  );

  const sorted = useMemo(() => {
    const rows = result?.records ?? [];
    if (!sortCol) return rows;
    return [...rows].sort((a, b) => {
      const va = (a[sortCol] ?? "").toLowerCase();
      const vb = (b[sortCol] ?? "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [result?.records, sortCol, sortDir]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return sorted;
    const q = filter.toLowerCase();
    return sorted.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [sorted, filter]);

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  }

  function toggleCol(col: string) {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  }

  function toggleReveal(col: string) {
    setRevealedCols((prev) => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  }

  function SortIcon({ col }: { col: string }) {
    if (sortCol !== col) return <ChevronsUpDown className="h-3 w-3 text-zinc-700" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-tide" />
      : <ChevronDown className="h-3 w-3 text-tide" />;
  }

  function exportCSV() {
    const lines = [
      visibleCols.join(","),
      ...filtered.map((row) =>
        visibleCols.map((c) => {
          const val = encryptedColsSet.has(c) && !revealedCols.has(c)
            ? "[ENCRYPTED]"
            : (row[c] ?? "");
          return `"${val.replace(/"/g, '""')}"`;
        }).join(",")
      ),
    ];
    triggerDownload(lines.join("\n"), `assetxocean-export-${Date.now()}.csv`, "text/csv");
  }

  function exportJSON() {
    const records = filtered.map((row) => {
      const out: Row = {};
      for (const c of visibleCols) {
        out[c] = encryptedColsSet.has(c) && !revealedCols.has(c)
          ? "[ENCRYPTED]"
          : (row[c] ?? "");
      }
      return out;
    });
    triggerDownload(
      JSON.stringify({ columns: visibleCols, records }, null, 2),
      `assetxocean-export-${Date.now()}.json`,
      "application/json"
    );
  }

  function reset() {
    setFile(null); setRawResult(null); setResult(null);
    setFieldConfigs([]); setError(""); setStatus("idle");
    setFilter(""); setSortCol(null);
    setHiddenCols(new Set()); setRevealedCols(new Set());
  }

  /* ── Render ── */
  return (
    <div className="space-y-6">

      {/* ── Upload zone (idle / reading / extracting / error) ── */}
      {status !== "field-select" && status !== "done" && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !file && inputRef.current?.click()}
          className={cn(
            "relative flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-all duration-200",
            dragging
              ? "border-tide/60 bg-tide/5 scale-[1.01]"
              : file
              ? "border-zinc-700/60 bg-zinc-900/30 cursor-default"
              : "border-zinc-800 bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-900/40 cursor-pointer"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) acceptFile(f); }}
          />

          {!file ? (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
                <Upload className="h-6 w-6 text-zinc-500" />
              </div>
              <div className="text-center">
                <p className="font-display text-base font-medium text-zinc-300">Drop a file to scan</p>
                <p className="mt-1 font-mono text-[11px] text-zinc-600">
                  TXT · XML · JSON · CSV · PNG · JPG · PDF · Nmap output
                </p>
              </div>
              <span className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 font-mono text-[11px] text-zinc-400 hover:border-zinc-600 transition-colors">
                Browse files
              </span>
            </>
          ) : (
            <div className="flex w-full flex-col gap-5 px-8">
              {/* File info */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-tide">
                  {fileIcon(file.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[13px] font-medium text-zinc-200">{file.name}</p>
                  <p className="font-mono text-[10px] text-zinc-600">{fmtBytes(file.size)} · {file.type || "text/plain"}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); reset(); }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Mode selector */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={(e) => { e.stopPropagation(); setMode(m.key); }}
                    className={cn(
                      "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all",
                      mode === m.key
                        ? "border-tide/40 bg-tide/5 ring-1 ring-tide/20"
                        : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                    )}
                  >
                    <m.Icon className={cn("h-4 w-4", mode === m.key ? "text-tide" : "text-zinc-500")} />
                    <span className={cn("font-mono text-[10px] font-semibold", mode === m.key ? "text-tide" : "text-zinc-400")}>
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>

              <p className="font-mono text-[10px] text-zinc-600">
                {MODES.find((m) => m.key === mode)?.desc}
              </p>

              {/* Custom fields */}
              {mode === "custom" && (
                <div onClick={(e) => e.stopPropagation()}>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                    Fields to extract (comma-separated)
                  </label>
                  <input
                    value={customFields}
                    onChange={(e) => setCustomFields(e.target.value)}
                    placeholder="e.g. domain, ip, port, service, cve, notes"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-[12px] text-zinc-200 outline-none focus:border-tide/50 transition-colors"
                  />
                </div>
              )}

              {/* Extract button */}
              <button
                onClick={(e) => { e.stopPropagation(); void extract(); }}
                disabled={status === "reading" || status === "extracting"}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl py-3 font-mono text-[12px] font-semibold transition-all",
                  status === "reading" || status === "extracting"
                    ? "bg-zinc-800 text-zinc-500 cursor-wait"
                    : "bg-tide text-abyss-900 hover:opacity-90"
                )}
              >
                {status === "reading" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Reading file…</>
                ) : status === "extracting" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending to Eagle server…</>
                ) : (
                  <><Cpu className="h-4 w-4" /> Extract Assets</>
                )}
              </button>

              {/* Error */}
              {status === "error" && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="font-mono text-[11px] text-red-300">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Field selection stage ── */}
      {status === "field-select" && rawResult && (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/20">

          {/* Header */}
          <div className="border-b border-zinc-800/80 px-5 py-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-tide" />
              <h3 className="text-sm font-semibold text-zinc-100">Configure extraction results</h3>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {rawResult.records.length} record{rawResult.records.length !== 1 ? "s" : ""} extracted
              from <span className="font-mono text-zinc-400">{file?.name}</span>.
              Choose which fields to include. Mark sensitive fields as{" "}
              <Lock className="inline h-3 w-3 text-amber-400" /> encrypted — they appear as ●●●●● in the table.
            </p>
          </div>

          {/* Select all / None row */}
          <div className="flex items-center gap-3 border-b border-zinc-800/60 px-5 py-2.5">
            <span className="text-[11px] text-zinc-600">
              {fieldConfigs.filter((fc) => fc.include).length} of {fieldConfigs.length} fields selected
              {fieldConfigs.filter((fc) => fc.encrypt).length > 0 && (
                <span className="ml-2 text-amber-500/70">
                  · {fieldConfigs.filter((fc) => fc.encrypt).length} encrypted
                </span>
              )}
            </span>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setAllIncluded(true)}
                className="rounded border border-zinc-700 px-2 py-1 font-mono text-[10px] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
              >
                Select all
              </button>
              <button
                onClick={() => setAllIncluded(false)}
                className="rounded border border-zinc-700 px-2 py-1 font-mono text-[10px] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
              >
                None
              </button>
            </div>
          </div>

          {/* Field cards */}
          <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {fieldConfigs.map((fc) => {
              /* Find a sample (first non-empty value for this column) */
              const sample = rawResult.records
                .map((r) => r[fc.col] ?? "")
                .find((v) => v.trim() !== "") ?? "";

              return (
                <div
                  key={fc.col}
                  onClick={() => toggleInclude(fc.col)}
                  className={cn(
                    "cursor-pointer rounded-xl border p-3 transition-all select-none",
                    fc.include
                      ? fc.encrypt
                        ? "border-amber-900/50 bg-amber-950/10 ring-1 ring-amber-900/30"
                        : "border-zinc-700 bg-zinc-800/60"
                      : "border-zinc-800/60 bg-zinc-900/20 opacity-50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Checkbox */}
                    <div className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      fc.include ? "border-tide bg-tide/20" : "border-zinc-700 bg-zinc-900"
                    )}>
                      {fc.include && (
                        <svg className="h-2.5 w-2.5 text-tide" fill="none" viewBox="0 0 10 10">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs font-semibold text-zinc-200 truncate">
                        {fc.col}
                      </p>
                      {sample && (
                        <p className="mt-0.5 truncate font-mono text-[10px] text-zinc-600" title={sample}>
                          e.g. {sample}
                        </p>
                      )}
                    </div>

                    {/* Encrypt toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleEncrypt(fc.col); }}
                      title={fc.encrypt ? "Remove encryption" : "Mark as encrypted"}
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all",
                        fc.encrypt
                          ? "border-amber-700/50 bg-amber-950/30 text-amber-400"
                          : "border-zinc-700 text-zinc-600 hover:border-amber-700/50 hover:text-amber-400"
                      )}
                    >
                      {fc.encrypt
                        ? <Lock className="h-3 w-3" />
                        : <LockOpen className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t border-zinc-800/60 px-5 py-3.5">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700/60 px-3 py-2 font-mono text-[11px] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Start over
            </button>
            <button
              onClick={buildTable}
              disabled={!fieldConfigs.some((fc) => fc.include)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-5 py-2 font-mono text-[12px] font-semibold transition-all",
                fieldConfigs.some((fc) => fc.include)
                  ? "bg-tide text-abyss-900 hover:opacity-90"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              )}
            >
              Build Table
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Results table ── */}
      {status === "done" && result && (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/20">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800/80 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
              <span className="font-mono text-[11px] text-zinc-400">
                <span className="text-zinc-200">{filtered.length}</span>
                {filtered.length !== result.records.length && (
                  <span className="text-zinc-600"> of {result.records.length}</span>
                )}
                {" "}assets
              </span>
            </div>

            {encryptedColsSet.size > 0 && (
              <>
                <span className="h-3 w-px bg-zinc-800" />
                <span className="flex items-center gap-1 font-mono text-[11px] text-amber-500/70">
                  <Lock className="h-3 w-3" />
                  {encryptedColsSet.size} encrypted field{encryptedColsSet.size !== 1 ? "s" : ""}
                </span>
              </>
            )}

            <span className="h-3 w-px bg-zinc-800" />

            {/* Filter */}
            <div className="relative flex-1 min-w-[140px] max-w-xs">
              <Filter className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-600" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter rows…"
                className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/60 py-1.5 pl-7 pr-3 font-mono text-[11px] text-zinc-200 outline-none focus:border-tide/40 transition-colors"
              />
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              {/* Column toggle */}
              <div className="relative">
                <button
                  onClick={() => setColMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-2.5 py-1.5 font-mono text-[10px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
                >
                  <Table2 className="h-3 w-3" />
                  Columns
                </button>
                {colMenuOpen && (
                  <div className="absolute right-0 top-full z-20 mt-1.5 min-w-[160px] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
                    {includedCols.map((col) => {
                      const visible = !hiddenCols.has(col);
                      return (
                        <button
                          key={col}
                          onClick={() => toggleCol(col)}
                          className="flex w-full items-center gap-2 px-3 py-2 font-mono text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                        >
                          {visible
                            ? <Eye className="h-3 w-3 text-tide" />
                            : <EyeOff className="h-3 w-3 text-zinc-600" />}
                          {col}
                          {encryptedColsSet.has(col) && <Lock className="ml-auto h-3 w-3 text-amber-500/60" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-2.5 py-1.5 font-mono text-[10px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors">
                <Download className="h-3 w-3" /> CSV
              </button>
              <button onClick={exportJSON} className="flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-2.5 py-1.5 font-mono text-[10px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors">
                <Download className="h-3 w-3" /> JSON
              </button>
              <button onClick={reset} className="flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-2.5 py-1.5 font-mono text-[10px] text-zinc-400 hover:border-red-900/50 hover:text-red-400 transition-colors">
                <RotateCcw className="h-3 w-3" /> New scan
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto">
            <table className="w-full min-w-max border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/50">
                  {visibleCols.map((col) => {
                    const isEnc = encryptedColsSet.has(col);
                    const isRev = revealedCols.has(col);
                    return (
                      <th
                        key={col}
                        className="px-4 py-2.5 text-left"
                      >
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleSort(col)}
                            className="flex items-center gap-1.5 cursor-pointer select-none"
                          >
                            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors">
                              {col.replace(/_/g, " ")}
                            </span>
                            <SortIcon col={col} />
                          </button>
                          {isEnc && (
                            <button
                              onClick={() => toggleReveal(col)}
                              title={isRev ? "Hide values" : "Reveal values temporarily"}
                              className={cn(
                                "flex h-4 w-4 items-center justify-center rounded transition-colors",
                                isRev ? "text-amber-400" : "text-zinc-700 hover:text-amber-400"
                              )}
                            >
                              {isRev ? <Eye className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                            </button>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={visibleCols.length} className="px-4 py-10 text-center font-mono text-[11px] text-zinc-700">
                      No records match your filter
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, i) => (
                    <tr key={i} className="border-b border-zinc-800/40 transition-colors hover:bg-zinc-800/30">
                      {visibleCols.map((col) => (
                        <td key={col} className="max-w-[260px] truncate px-4 py-2.5" title={row[col]}>
                          <CellValue
                            col={col}
                            val={row[col] ?? ""}
                            encrypted={encryptedColsSet.has(col)}
                            revealed={revealedCols.has(col)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-zinc-800/60 px-4 py-2.5">
            <p className="font-mono text-[10px] text-zinc-700">
              {file?.name} · {MODES.find((m) => m.key === mode)?.label} mode
            </p>
            <p className="font-mono text-[10px] text-zinc-700">
              {filtered.length} rows · {visibleCols.length} of {result.columns.length} columns
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
