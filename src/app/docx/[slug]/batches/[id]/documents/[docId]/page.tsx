"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, X, Lock, AlertTriangle } from "lucide-react";

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

  const handleAddField = () => {
    const newField: ExtractedField = {
      name: "",
      value: selectedText,
      verified: false,
      encrypted: false,
      isPii: false,
    };
    setFields([...fields, newField]);
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
    setSaving(true);

    const extractedData: Record<string, any> = {};
    fields.forEach((field) => {
      if (field.name) {
        extractedData[field.name] = {
          value: field.value,
          verified: field.verified,
          encrypted: field.encrypted,
          isPii: field.isPii,
        };
      }
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
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center text-red-400">Document not found</div>
      </div>
    );
  }

  const isImageFile = doc.fileType?.startsWith("image/");
  const isPdfFile = doc.fileType === "application/pdf";

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

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-tide px-4 py-2 font-semibold text-black disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save & Done"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preview Section */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="font-semibold text-zinc-100 mb-4">Document Preview</h2>

          <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-4 min-h-96 max-h-screen overflow-auto">
            {isImageFile ? (
              <img
                src={`data:${doc.fileType};base64,${doc.rawContent}`}
                alt="Document"
                className="w-full rounded"
              />
            ) : (
              <div
                className="text-zinc-300 text-sm whitespace-pre-wrap break-words cursor-text select-text p-4"
                onMouseUp={() => {
                  const selection = window.getSelection();
                  if (selection && selection.toString().length > 0) {
                    setSelectedText(selection.toString());
                  }
                }}
              >
                {doc.extractedText || "No text extracted"}
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-zinc-600">
            💡 Highlight text in the preview, then click "Add Field" to extract it
          </p>
        </div>

        {/* Field Mapper Section */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="font-semibold text-zinc-100 mb-4">
            Extracted Fields ({fields.length})
          </h2>

          <div className="space-y-3 max-h-screen overflow-auto">
            {fields.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <p>No fields yet</p>
                <p className="text-xs">
                  Select text and add fields from the preview
                </p>
              </div>
            ) : (
              fields.map((field, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) =>
                        handleUpdateField(idx, { ...field, name: e.target.value })
                      }
                      placeholder="Field name (e.g., invoice_number)"
                      className="flex-1 bg-transparent text-sm font-semibold text-zinc-100 placeholder-zinc-600 focus:outline-none"
                    />
                    <button
                      onClick={() => handleRemoveField(idx)}
                      className="text-zinc-600 hover:text-red-400 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <textarea
                    value={field.value}
                    onChange={(e) =>
                      handleUpdateField(idx, { ...field, value: e.target.value })
                    }
                    placeholder="Field value"
                    className="w-full bg-zinc-950 text-xs text-zinc-300 rounded px-2 py-1 mb-2 resize-none focus:outline-none focus:border-zinc-600"
                    rows={2}
                  />

                  <div className="flex gap-2 text-xs">
                    <label className="flex items-center gap-1 cursor-pointer text-zinc-400 hover:text-zinc-200">
                      <input
                        type="checkbox"
                        checked={field.encrypted}
                        onChange={(e) =>
                          handleUpdateField(idx, {
                            ...field,
                            encrypted: e.target.checked,
                          })
                        }
                      />
                      <Lock className="h-3 w-3" />
                      Encrypt
                    </label>

                    <label className="flex items-center gap-1 cursor-pointer text-zinc-400 hover:text-zinc-200">
                      <input
                        type="checkbox"
                        checked={field.isPii}
                        onChange={(e) =>
                          handleUpdateField(idx, {
                            ...field,
                            isPii: e.target.checked,
                          })
                        }
                      />
                      <AlertTriangle className="h-3 w-3" />
                      PII
                    </label>

                    <label className="flex items-center gap-1 cursor-pointer text-zinc-400 hover:text-zinc-200 ml-auto">
                      <input
                        type="checkbox"
                        checked={field.verified}
                        onChange={(e) =>
                          handleUpdateField(idx, {
                            ...field,
                            verified: e.target.checked,
                          })
                        }
                      />
                      Verified
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedText && (
            <button
              onClick={handleAddField}
              className="mt-4 w-full rounded-lg border border-tide bg-tide/10 px-3 py-2 text-sm font-semibold text-tide transition hover:bg-tide/20"
            >
              Add Field from Selection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
