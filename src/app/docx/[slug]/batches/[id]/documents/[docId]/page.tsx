"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  X,
  Lock,
  AlertTriangle,
  Download,
  Eye,
  Check,
} from "lucide-react";

interface ExtractedField {
  name: string;
  value: string;
  verified: boolean;
  encrypted: boolean;
  isPii: boolean;
}

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
  const [showTablePreview, setShowTablePreview] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      const res = await fetch(`/api/docx/documents/${docId}`);
      if (res.ok) {
        const data = await res.json();
        setDoc(data);

        // Parse existing extracted data
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

  const handleSelectText = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const text = selection.toString().trim();
      setFieldValue(text);
      setSelectedText(text);
    }
  };

  const handleAddField = () => {
    if (!fieldName.trim() || !fieldValue.trim()) {
      alert("Field name and value are required");
      return;
    }

    const newField: ExtractedField = {
      name: fieldName.trim(),
      value: fieldValue.trim(),
      verified: false,
      encrypted: false,
      isPii: false,
    };

    // Check for duplicates
    if (fields.some((f) => f.name.toLowerCase() === fieldName.toLowerCase())) {
      alert("Field name already exists");
      return;
    }

    setFields([...fields, newField]);
    setFieldName("");
    setFieldValue("");
    setSelectedText("");
  };

  const handleUpdateField = (index: number, field: ExtractedField) => {
    const updated = [...fields];
    updated[index] = field;
    setFields(updated);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
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
      body: JSON.stringify({
        extractedData,
        status: "verified",
      }),
    });

    if (res.ok) {
      setSaving(false);
      router.push(`/docx/${slug}/batches/${batchId}`);
    } else {
      alert("Save failed");
      setSaving(false);
    }
  };

  const handleExportExcel = async () => {
    if (fields.length === 0) {
      alert("No fields to export");
      return;
    }

    setExporting(true);

    try {
      // Create CSV content
      const headers = fields.map((f) => f.name).join(",");
      const values = fields.map((f) => `"${f.value.replace(/"/g, '""')}"`).join(",");
      const csv = `${headers}\n${values}`;

      // Download CSV
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doc.fileName.replace(/\.[^/.]+$/, "")}_extracted.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Export failed");
    }

    setExporting(false);
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/docx/${slug}/batches/${batchId}`}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="h-4 w-4 text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">
              {doc.fileName}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {doc.fileSizeKb}KB • {doc.fileType}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {fields.length > 0 && (
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 font-semibold text-zinc-300 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
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
        {/* Left: Document Preview */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="font-semibold text-zinc-100 mb-4">Document Text</h2>

          <div
            className="rounded-lg border border-zinc-700 bg-zinc-950 p-4 min-h-96 max-h-96 overflow-auto text-sm text-zinc-300 whitespace-pre-wrap break-words select-text cursor-text"
            onMouseUp={handleSelectText}
          >
            {doc.extractedText || "No text extracted"}
          </div>

          <p className="mt-3 text-xs text-zinc-600">
            💡 Highlight text above, then add as a field →
          </p>
        </div>

        {/* Right: Field Mapper */}
        <div className="space-y-6">
          {/* Add Field Form */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="font-semibold text-zinc-100 mb-4">Add Field</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Field Name
                </label>
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="e.g., Order No, KRA PIN, Total"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                  onKeyPress={(e) => e.key === "Enter" && handleAddField()}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Field Value {selectedText && "(from selection)"}
                </label>
                <textarea
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder="Paste or type the extracted value"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none resize-none"
                  rows={2}
                />
              </div>

              <button
                onClick={handleAddField}
                className="w-full rounded-lg bg-tide px-3 py-2 text-sm font-semibold text-black transition hover:bg-tide/90"
              >
                + Add Field
              </button>
            </div>
          </div>

          {/* Table Preview */}
          {fields.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-100">
                  Extracted Data ({fields.length})
                </h3>
                <button
                  onClick={() => setShowTablePreview(!showTablePreview)}
                  className="flex items-center gap-1 text-xs text-tide hover:underline"
                >
                  <Eye className="h-3 w-3" />
                  {showTablePreview ? "Hide" : "Preview"}
                </button>
              </div>

              {showTablePreview && (
                <div className="mb-4 border border-zinc-700 rounded overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-zinc-800">
                        <th className="px-3 py-2 text-left text-zinc-300 font-semibold">
                          Field
                        </th>
                        <th className="px-3 py-2 text-left text-zinc-300 font-semibold">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-700">
                      {fields.map((field) => (
                        <tr key={field.name} className="hover:bg-zinc-900/50">
                          <td className="px-3 py-2 text-zinc-300 font-mono">
                            {field.name}
                          </td>
                          <td className="px-3 py-2 text-zinc-400 truncate">
                            {field.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Field List */}
              <div className="space-y-2 max-h-64 overflow-auto">
                {fields.map((field, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-100 truncate">
                          {field.name}
                        </p>
                        <p className="text-xs text-zinc-600 truncate mt-0.5">
                          {field.value}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveField(idx)}
                        className="text-zinc-600 hover:text-red-400 transition flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex gap-2 flex-wrap text-xs">
                      <label className="flex items-center gap-1 cursor-pointer text-zinc-500 hover:text-zinc-300">
                        <input
                          type="checkbox"
                          checked={field.encrypted}
                          onChange={(e) =>
                            handleUpdateField(idx, {
                              ...field,
                              encrypted: e.target.checked,
                            })
                          }
                          className="w-3 h-3"
                        />
                        <Lock className="h-3 w-3" />
                        Encrypt
                      </label>

                      <label className="flex items-center gap-1 cursor-pointer text-zinc-500 hover:text-zinc-300">
                        <input
                          type="checkbox"
                          checked={field.isPii}
                          onChange={(e) =>
                            handleUpdateField(idx, {
                              ...field,
                              isPii: e.target.checked,
                            })
                          }
                          className="w-3 h-3"
                        />
                        <AlertTriangle className="h-3 w-3" />
                        PII
                      </label>

                      <label className="flex items-center gap-1 cursor-pointer text-zinc-500 hover:text-zinc-300 ml-auto">
                        <input
                          type="checkbox"
                          checked={field.verified}
                          onChange={(e) =>
                            handleUpdateField(idx, {
                              ...field,
                              verified: e.target.checked,
                            })
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
