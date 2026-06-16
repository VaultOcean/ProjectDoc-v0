"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  X,
  Lock,
  AlertTriangle,
  Download,
  Check,
  ChevronDown,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  generateCSV,
  generateJSON,
  generateHTML,
  createBlob,
  downloadFile,
  getFileExtension,
  getMimeType,
} from "@/lib/export";
import {
  detectFields,
  detectFieldsFromLayout,
  type DetectedField,
  type PositionedPage,
} from "@/lib/smart-fields";
import VisualSelector from "./VisualSelector";

interface ExtractedField {
  name: string;
  value: string;
  verified: boolean;
  encrypted: boolean;
  isPii: boolean;
}

type ViewMode = "text" | "visual";

export default function DocumentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const batchId = params.id as string;
  const docId = params.docId as string;

  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [fieldValue, setFieldValue] = useState("");
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("visual");
  const [layoutPages, setLayoutPages] = useState<PositionedPage[]>([]);
  const [layoutLoading, setLayoutLoading] = useState(true);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoc = async () => {
      const res = await fetch(`/api/docx/documents/${docId}`);
      if (res.ok) {
        const data = await res.json();
        setDoc(data);

        const extractedData = data.extractedData || {};
        const initialFields = Object.entries(extractedData).map(
          ([name, value]: [string, any]) => ({
            name,
            value: value.value || "",
            verified: value.verified || false,
            encrypted: value.encrypted || false,
            isPii: value.isPii || false,
          })
        );
        setFields(initialFields);
      }
      setLoading(false);
    };

    fetchDoc();
  }, [docId]);

  // Fetch positioned layout once — powers both the visual selector and the
  // (more accurate) geometric auto-detection.
  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await fetch(`/api/docx/documents/${docId}/layout`);
        if (!res.ok) throw new Error("layout");
        const data = await res.json();
        setLayoutPages(data.pages || []);
      } catch {
        setLayoutError("Could not load visual preview.");
      } finally {
        setLayoutLoading(false);
      }
    };
    fetchLayout();
  }, [docId]);

  // Prefer geometric detection (position-aware); fall back to text parsing
  // if the layout couldn't be extracted.
  const detected = useMemo<DetectedField[]>(() => {
    if (layoutPages.length > 0) return detectFieldsFromLayout(layoutPages);
    return doc?.extractedText ? detectFields(doc.extractedText) : [];
  }, [layoutPages, doc?.extractedText]);

  const hasField = (name: string) =>
    fields.some((f) => f.name.toLowerCase() === name.toLowerCase());

  const addField = (name: string, value: string): boolean => {
    const n = name.trim();
    const v = value.trim();
    if (!n || !v) return false;
    if (hasField(n)) return false;
    setFields((prev) => [
      ...prev,
      { name: n, value: v, verified: false, encrypted: false, isPii: false },
    ]);
    return true;
  };

  const toggleDetected = (d: DetectedField) => {
    if (hasField(d.name)) {
      setFields((prev) =>
        prev.filter((f) => f.name.toLowerCase() !== d.name.toLowerCase())
      );
    } else {
      addField(d.name, d.value);
    }
  };

  const handleSelectText = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const text = selection.toString().trim();
      setFieldValue(text);
      setSelectedText(text);
    }
  };

  const handleAddManual = () => {
    if (!fieldName.trim() || !fieldValue.trim()) {
      alert("Field name and value are required");
      return;
    }
    if (hasField(fieldName)) {
      alert("Field name already exists");
      return;
    }
    addField(fieldName, fieldValue);
    setFieldName("");
    setFieldValue("");
    setSelectedText("");
  };

  const updateField = (index: number, patch: Partial<ExtractedField>) => {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f))
    );
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (fields.length === 0) {
      alert("Please add at least one field");
      return;
    }
    setSaving(true);

    const extractedData: Record<string, any> = {};
    fields.forEach((field) => {
      extractedData[field.name] = {
        value: field.value,
        verified: field.verified,
        encrypted: field.encrypted,
        isPii: field.isPii,
      };
    });

    const res = await fetch(`/api/docx/documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extractedData, status: "verified" }),
    });

    if (res.ok) {
      setSaving(false);
      router.push(`/docx/${slug}/batches/${batchId}`);
    } else {
      alert("Save failed");
      setSaving(false);
    }
  };

  const handleExport = async (format: "csv" | "json" | "html") => {
    if (fields.length === 0) {
      alert("No fields to export");
      return;
    }
    setExporting(true);
    try {
      const baseFileName = doc.fileName.replace(/\.[^/.]+$/, "");
      let content: string;
      switch (format) {
        case "csv":
          content = generateCSV(fields);
          break;
        case "json":
          content = generateJSON(fields);
          break;
        case "html":
          content = generateHTML(fields, baseFileName);
          break;
        default:
          throw new Error("Unknown format");
      }
      const blob = createBlob(content, getMimeType(format));
      downloadFile(blob, `${baseFileName}_extracted.${getFileExtension(format)}`);
    } catch {
      alert("Export failed");
    }
    setExporting(false);
    setShowExportMenu(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-center text-zinc-400">Loading document...</div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-center text-red-400">Document not found</div>
      </div>
    );
  }

  const unusedDetected = detected.filter((d) => !hasField(d.name));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={`/docx/${slug}/batches/${batchId}`}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-zinc-400" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-zinc-100 truncate">
              {doc.fileName}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {doc.fileSizeKb}KB • {doc.fileType}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {fields.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exporting}
                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 font-semibold text-zinc-300 disabled:opacity-50 hover:bg-zinc-800"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export"}
                <ChevronDown className="h-4 w-4" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg border border-zinc-700 bg-zinc-900 shadow-lg z-10">
                  {[
                    { format: "csv", label: "CSV (Excel)" },
                    { format: "json", label: "JSON" },
                    { format: "html", label: "HTML (Print)" },
                  ].map((option) => (
                    <button
                      key={option.format}
                      onClick={() => handleExport(option.format as any)}
                      className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || fields.length === 0}
            className="flex items-center gap-2 rounded-lg bg-tide px-4 py-2 font-semibold text-black disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save & Done"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Document Preview (Visual / Text) */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-100">Document Preview</h2>
            <div className="inline-flex rounded-lg border border-zinc-700 bg-zinc-950 p-0.5 text-xs">
              <button
                onClick={() => setViewMode("visual")}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  viewMode === "visual"
                    ? "bg-tide text-black"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Visual
              </button>
              <button
                onClick={() => setViewMode("text")}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  viewMode === "text"
                    ? "bg-tide text-black"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Text
              </button>
            </div>
          </div>

          {viewMode === "visual" ? (
            <VisualSelector
              pages={layoutPages}
              loading={layoutLoading}
              error={layoutError}
              onAdd={addField}
            />
          ) : (
            <>
              <div
                className="rounded-lg border border-zinc-700 bg-zinc-950 p-4 min-h-[28rem] max-h-[28rem] overflow-auto text-sm text-zinc-300 whitespace-pre-wrap break-words select-text cursor-text"
                onMouseUp={handleSelectText}
              >
                {doc.extractedText || "No text extracted"}
              </div>
              <p className="mt-3 text-xs text-zinc-600">
                Highlight any text above to drop it into the value box →
              </p>
            </>
          )}
        </div>

        {/* Right: Smart detection + manual add */}
        <div className="space-y-6">
          {/* Detected fields */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-tide" />
              <h3 className="font-semibold text-zinc-100">Detected Fields</h3>
              <span className="text-xs text-zinc-500">
                ({unusedDetected.length} available)
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Click a label to add it as a column. The value is mapped
              automatically — you can edit it in the table below.
            </p>

            {unusedDetected.length === 0 ? (
              <p className="text-xs text-zinc-600">
                {detected.length === 0
                  ? "No fields auto-detected. Use the manual add or highlight text."
                  : "All detected fields added."}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {unusedDetected.map((d) => (
                  <button
                    key={d.name}
                    onClick={() => toggleDetected(d)}
                    className="group flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-left transition hover:border-tide hover:bg-zinc-900"
                  >
                    <Plus className="h-3 w-3 text-tide" />
                    <span className="text-xs font-semibold text-zinc-200">
                      {d.name}
                    </span>
                    <span className="text-xs text-zinc-500 max-w-[10rem] truncate">
                      {d.value}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Manual add */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="font-semibold text-zinc-100 mb-4">Add Field Manually</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Column Name
                </label>
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="e.g., Order No, KRA PIN, Total"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleAddManual()}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Value {selectedText && "(from selection)"}
                </label>
                <textarea
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder="Highlight text on the left, or type here"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none resize-none"
                  rows={2}
                />
              </div>
              <button
                onClick={handleAddManual}
                className="w-full rounded-lg bg-tide px-3 py-2 text-sm font-semibold text-black transition hover:bg-tide/90"
              >
                + Add Column
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Excel-style table */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-zinc-100">
            Table Preview{" "}
            <span className="text-xs font-normal text-zinc-500">
              ({fields.length} column{fields.length === 1 ? "" : "s"})
            </span>
          </h3>
          {fields.length > 0 && (
            <span className="text-xs text-zinc-500">
              This document is one row. A batch export combines all documents
              into multiple rows.
            </span>
          )}
        </div>

        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-700 p-10 text-center">
            <p className="text-sm text-zinc-500">
              No columns yet. Click a detected field above or add one manually.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-700">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-800">
                  {fields.map((f, idx) => (
                    <th
                      key={idx}
                      className="px-3 py-2 text-left font-semibold text-zinc-200 border-r border-zinc-700 last:border-r-0 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          {f.encrypted && (
                            <Lock className="h-3 w-3 text-amber-400" />
                          )}
                          {f.isPii && (
                            <AlertTriangle className="h-3 w-3 text-red-400" />
                          )}
                          {f.name}
                        </span>
                        <button
                          onClick={() => removeField(idx)}
                          className="text-zinc-500 hover:text-red-400"
                          title="Remove column"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-zinc-950">
                  {fields.map((f, idx) => (
                    <td
                      key={idx}
                      className="px-3 py-2 border-r border-zinc-800 last:border-r-0 align-top"
                    >
                      <input
                        value={f.value}
                        onChange={(e) =>
                          updateField(idx, { value: e.target.value })
                        }
                        className="w-full min-w-[8rem] bg-transparent text-zinc-300 focus:outline-none focus:text-zinc-100"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Per-column flags */}
        {fields.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((f, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2"
              >
                <p className="text-xs font-semibold text-zinc-300 truncate mb-1.5">
                  {f.name}
                </p>
                <div className="flex gap-3 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer text-zinc-500 hover:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={f.encrypted}
                      onChange={(e) =>
                        updateField(idx, { encrypted: e.target.checked })
                      }
                      className="w-3 h-3"
                    />
                    <Lock className="h-3 w-3" />
                    Encrypt
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-zinc-500 hover:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={f.isPii}
                      onChange={(e) =>
                        updateField(idx, { isPii: e.target.checked })
                      }
                      className="w-3 h-3"
                    />
                    <AlertTriangle className="h-3 w-3" />
                    PII
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-zinc-500 hover:text-zinc-300 ml-auto">
                    <input
                      type="checkbox"
                      checked={f.verified}
                      onChange={(e) =>
                        updateField(idx, { verified: e.target.checked })
                      }
                      className="w-3 h-3"
                    />
                    <Check className="h-3 w-3" />
                    Verified
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
