"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  FileText,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSizeKb: number;
  status: string;
  createdAt: string;
}

interface Batch {
  id: string;
  name: string;
  status: string;
  documentType: { name: string };
  storageBackend: { name: string; type: string };
  documents: Document[];
  _count: { documents: number };
}

export default function BatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const batchId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        const res = await fetch(`/api/docx/batches/${batchId}`);
        if (res.ok) {
          const data = await res.json();
          setBatch(data);
        }
      } catch (error) {
        console.error("Error fetching batch:", error);
      }
      setLoading(false);
    };

    fetchBatch();
    const interval = setInterval(fetchBatch, 3000);
    return () => clearInterval(interval);
  }, [batchId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("batchId", batchId);

    try {
      const res = await fetch("/api/docx/documents", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const newDoc = await res.json();
        if (batch) {
          setBatch({
            ...batch,
            documents: [newDoc.docFile, ...batch.documents],
            _count: { documents: batch._count.documents + 1 },
          });
        }
      } else {
        const error = await res.json();
        alert(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      alert("Upload error: " + String(error));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Delete this document?")) return;

    setDeleting(docId);
    try {
      const res = await fetch(`/api/docx/documents/${docId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (batch) {
          setBatch({
            ...batch,
            documents: batch.documents.filter((d) => d.id !== docId),
            _count: { documents: batch._count.documents - 1 },
          });
        }
      } else {
        alert("Delete failed");
      }
    } catch (error) {
      alert("Delete error");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteBatch = async () => {
    if (!confirm("Delete entire batch? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/docx/batches/${batchId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push(`/docx/${slug}/dashboard`);
      } else {
        alert("Delete failed");
      }
    } catch (error) {
      alert("Delete error");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center text-zinc-400">Loading batch...</div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center text-red-400">Batch not found</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/docx/${slug}/dashboard`}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="h-4 w-4 text-zinc-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-zinc-100">{batch.name}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {batch.documentType.name} • {batch.storageBackend.name}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDeleteBatch}
            className="flex items-center gap-2 rounded-lg border border-red-700/50 bg-red-950/20 px-4 py-2 font-semibold text-red-400 hover:bg-red-950/40"
          >
            <Trash2 className="h-4 w-4" />
            Delete Batch
          </button>
          <span
            className={`rounded px-3 py-1 text-xs font-semibold ${
              batch.status === "uploading"
                ? "bg-blue-900/30 text-blue-400"
                : batch.status === "completed"
                  ? "bg-green-900/30 text-green-400"
                  : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {batch.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Area */}
          <div className="rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/30 p-12 text-center transition hover:border-zinc-600 hover:bg-zinc-900/50">
            <label className="cursor-pointer block">
              <Upload className="mx-auto mb-4 h-8 w-8 text-zinc-500" />
              <h3 className="font-semibold text-zinc-100">
                Click to upload a file
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                or drag and drop
              </p>
              <p className="mt-2 text-xs text-zinc-600">
                PDF, JPG, PNG up to 25MB
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />

              {uploading && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  <span className="text-xs text-blue-400">Uploading...</span>
                </div>
              )}
            </label>
          </div>

          {/* Documents List */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="border-b border-zinc-800 px-6 py-4">
              <h2 className="font-semibold text-zinc-100">
                Documents ({batch._count.documents})
              </h2>
            </div>

            {batch.documents.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
                <p className="text-sm text-zinc-500">
                  No documents. Upload files to get started.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {batch.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-zinc-900/30 transition"
                  >
                    <Link
                      href={`/docx/${slug}/batches/${batch.id}/documents/${doc.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-mono text-sm text-zinc-100 truncate">
                            {doc.fileName}
                          </p>
                          <p className="text-xs text-zinc-600">
                            {doc.fileSizeKb}KB •{" "}
                            {new Date(doc.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Link>

                    <div className="ml-4 flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold ${
                          doc.status === "pending"
                            ? "text-blue-400"
                            : doc.status === "verified"
                              ? "text-green-400"
                              : "text-zinc-500"
                        }`}
                      >
                        {doc.status}
                      </span>

                      {doc.status === "verified" && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}

                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        disabled={deleting === doc.id}
                        className="text-zinc-600 hover:text-red-400 transition disabled:opacity-50"
                      >
                        {deleting === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 h-fit">
          <h3 className="font-semibold text-zinc-100 mb-4">Batch Info</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-zinc-600">Status</p>
              <p className="text-zinc-100 capitalize">{batch.status}</p>
            </div>
            <div>
              <p className="text-zinc-600">Documents</p>
              <p className="text-zinc-100">{batch._count.documents}</p>
            </div>
            <div>
              <p className="text-zinc-600">Document Type</p>
              <p className="text-zinc-100">{batch.documentType.name}</p>
            </div>
            <div>
              <p className="text-zinc-600">Storage Backend</p>
              <p className="text-zinc-100">{batch.storageBackend.name}</p>
            </div>
            <div className="pt-3 border-t border-zinc-800">
              <Link
                href={`/docx/${slug}/batches/${batch.id}/export`}
                className="block rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-center text-sm font-semibold text-zinc-300 transition hover:bg-zinc-700"
              >
                Export Batch
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
