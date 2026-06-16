"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, FileText, Check, AlertCircle, Loader2 } from "lucide-react";

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
}

export default function BatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const batchId = params.id as string;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const fetchBatch = async () => {
      const res = await fetch(`/api/docx/batches/${batchId}`);
      if (res.ok) {
        const data = await res.json();
        setBatch(data);
      }
      setLoading(false);
    };

    fetchBatch();
  }, [batchId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("batchId", batchId);

    try {
      const res = await fetch("/api/docx/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setUploadProgress(100);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        alert("Upload failed");
      }
    } catch (error) {
      alert("Upload error");
    } finally {
      setUploading(false);
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Area */}
          <div className="rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/30 p-12 text-center transition hover:border-zinc-600 hover:bg-zinc-900/50">
            <label className="cursor-pointer block">
              <Upload className="mx-auto mb-4 h-8 w-8 text-zinc-500" />
              <h3 className="font-semibold text-zinc-100">
                Upload a document
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Click to select a file
              </p>
              <p className="mt-2 text-xs text-zinc-600">
                PDF, JPG, PNG up to 25MB
              </p>

              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />

              {uploading && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  <span className="text-xs text-blue-400">
                    Uploading... {uploadProgress}%
                  </span>
                </div>
              )}
            </label>
          </div>

          {/* Documents List */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="border-b border-zinc-800 px-6 py-4">
              <h2 className="font-semibold text-zinc-100">
                Documents ({batch.documents.length})
              </h2>
            </div>

            {batch.documents.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
                <p className="text-sm text-zinc-500">
                  No documents uploaded yet. Upload files to get started.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {batch.documents.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/docx/${slug}/batches/${batch.id}/documents/${doc.id}`}
                    className="flex items-center justify-between px-6 py-4 transition hover:bg-zinc-900/50"
                  >
                    <div className="flex-1 min-w-0">
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
                    </div>

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
                        {doc.status === "pending" && "Pending"}
                        {doc.status === "extracted" && "Extracted"}
                        {doc.status === "verified" && "Verified"}
                        {doc.status === "failed" && "Failed"}
                      </span>

                      {doc.status === "verified" && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </Link>
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
              <p className="text-zinc-100">{batch.documents.length}</p>
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
