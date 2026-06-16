import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import * as pdfjsLib from "pdfjs-dist";

/**
 * POST /api/docx/documents/upload
 * Upload a document file to a batch and extract text
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const batchId = formData.get("batchId") as string;

    if (!file || !batchId) {
      return NextResponse.json(
        { error: "file and batchId required" },
        { status: 400 }
      );
    }

    // Verify user has access to batch
    const batch = await db.uploadBatch.findUnique({
      where: { id: batchId },
      include: { company: true, createdByUser: true },
    });

    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      );
    }

    // Verify user is in company
    const companyUser = await db.companyUser.findUnique({
      where: { companyId_userId: { companyId: batch.companyId, userId: user.id } },
    });

    if (!companyUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Read file content
    const buffer = await file.arrayBuffer();
    const rawContent = Buffer.from(buffer).toString("base64");

    // Extract text if PDF
    let extractedText = "";
    if (file.type === "application/pdf") {
      try {
        const uint8Array = new Uint8Array(buffer);
        const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
        const textChunks: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const text = textContent.items
            .map((item: any) => item.str)
            .join(" ");
          textChunks.push(text);
        }

        extractedText = textChunks.join("\n\n");
      } catch (pdfError) {
        console.warn("PDF text extraction failed:", pdfError);
        extractedText = "[PDF text extraction failed]";
      }
    } else if (file.type.startsWith("image/")) {
      extractedText = "[Image - OCR coming soon]";
    }

    // Create document file record
    const docFile = await db.documentFile.create({
      data: {
        batchId,
        fileName: file.name,
        fileType: file.type,
        fileSizeKb: Math.ceil(file.size / 1024),
        rawContent,
        extractedText,
        status: extractedText ? "extracted" : "pending",
        extractedData: JSON.stringify({}),
      },
    });

    // Update batch file count
    await db.uploadBatch.update({
      where: { id: batchId },
      data: { totalFiles: { increment: 1 } },
    });

    // Log to audit
    await db.auditLog.create({
      data: {
        companyId: batch.companyId,
        companyUserId: companyUser.id,
        action: "upload_document",
        resource: "DocumentFile",
        resourceId: docFile.id,
        details: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          batchId,
          textLength: extractedText.length,
        }),
      },
    });

    return NextResponse.json({ docFile }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
