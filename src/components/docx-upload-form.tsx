"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, AlertTriangle, FileText } from "lucide-react";
import { cn } from "@/lib/cn";

export function DocxUploadForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = ".pdf,.txt,.json,.xml,.csv,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.gif,.bmp";
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  }, []);

  function acceptFile(f: File) {
    if (f.size > MAX_SIZE) {
      setError("File too large. Maximum 50 MB.");
      return;
    }
    setFile(f);
    setError("");
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      /* Create session */
      const sessionRes = await fetch("/api/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name.split(".").slice(0, -1).join(".") || file.name,
          fileName: file.name,
          fileType: file.type,
          fileSizeMb: file.size / (1024 * 1024),
        }),
      });

      if (!sessionRes.ok) throw new Error("Failed to create session");
      const { session } = await sessionRes.json() as { session: { id: string } };

      /* Read file */
      const fileData = await new Promise<{ content: string; mimeType: string }>((resolve, reject) => {
        const isImage = file.type.startsWith("image/");
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("File read failed"));
        if (isImage) {
          reader.onload = () => {
            const dataUrl = reader.result as string;
            resolve({ content: dataUrl.split(",")[1] ?? dataUrl, mimeType: file.type });
          };
          reader.readAsDataURL(file);
        } else {
          reader.onload = () => resolve({ content: reader.result as string, mimeType: file.type || "text/plain" });
          reader.readAsText(file);
        }
      });

      /* Extract */
      const extractRes = await fetch(`/api/docx/${session.id}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: fileData.content,
          mimeType: fileData.mimeType,
        }),
      });

      if (!extractRes.ok) {
        const data = await extractRes.json() as { error: string };
        throw new Error(data.error || "Extraction failed");
      }

      router.push(`/docx/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={cn(
          "relative flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-all duration-200",
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
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
              <Upload className="h-8 w-8 text-zinc-500" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-zinc-200">
                Drop your document here
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                PDF, image, spreadsheet, JSON, XML, or text file
              </p>
              <p className="mt-2 text-xs text-zinc-600">Maximum 50 MB</p>
            </div>
            <button className="rounded-lg border border-zinc-700 bg-zinc-800 px-6 py-2.5 font-mono text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors">
              Browse files
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-tide">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="font-mono text-sm font-medium text-zinc-200">{file.name}</p>
              <p className="mt-1 text-xs text-zinc-600">
                {(file.size / 1024 / 1024).toFixed(1)} MB · {file.type || "text/plain"}
              </p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Choose different file
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex gap-3 rounded-xl border border-red-900/40 bg-red-950/20 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Upload button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={cn(
            "w-full rounded-xl py-3 font-mono text-sm font-semibold transition-all",
            uploading
              ? "bg-zinc-800 text-zinc-600 cursor-wait"
              : "bg-tide text-abyss-900 hover:opacity-90"
          )}
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading & extracting…
            </span>
          ) : (
            "Upload & Extract"
          )}
        </button>
      )}

      {/* Info */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { title: "Instant OCR", desc: "Eagle extracts text + structured fields automatically" },
          { title: "Type Inference", desc: "Auto-detect IP, email, URL, date, number types" },
          { title: "PII Detection", desc: "Flag sensitive data like SSN, phone, credit card" },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="font-semibold text-sm text-zinc-200">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
