import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DocxUploadForm } from "@/components/docx-upload-form";

export const metadata: Metadata = {
  title: "Upload document — Docx",
};

export default async function DocxNewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/docx/new");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Upload document</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Upload any file — PDF, image, spreadsheet, text. We'll extract structured data using Eagle OCR.
        </p>
      </div>
      <DocxUploadForm userId={user.id} />
    </div>
  );
}
