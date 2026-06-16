import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/docx/documents/upload
 * Upload a document file to a batch
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

    // Create document file record
    const docFile = await db.documentFile.create({
      data: {
        batchId,
        fileName: file.name,
        fileType: file.type,
        fileSizeKb: Math.ceil(file.size / 1024),
        rawContent,
        status: "pending",
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
