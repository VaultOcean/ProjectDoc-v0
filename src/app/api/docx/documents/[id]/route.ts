import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/docx/documents/[id]
 * Get document file with extracted data
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const doc = await db.documentFile.findUnique({
    where: { id },
    include: { batch: { include: { company: true, documentType: true } } },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Verify access
  const companyUser = await db.companyUser.findUnique({
    where: {
      companyId_userId: {
        companyId: doc.batch.companyId,
        userId: user.id,
      },
    },
  });

  if (!companyUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({
    id: doc.id,
    fileName: doc.fileName,
    fileType: doc.fileType,
    fileSizeKb: doc.fileSizeKb,
    status: doc.status,
    rawContent: doc.rawContent, // Base64 encoded file content
    extractedText: doc.extractedText, // Extracted text from document
    extractedData: JSON.parse(doc.extractedData),
    batchId: doc.batchId,
    batch: {
      id: doc.batch.id,
      name: doc.batch.name,
      documentType: doc.batch.documentType.name,
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}

/**
 * DELETE /api/docx/documents/[id]
 * Delete a document file
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const doc = await db.documentFile.findUnique({
    where: { id },
    include: { batch: true },
  });

  if (!doc) {
    return NextResponse.json(
      { error: "Document not found" },
      { status: 404 }
    );
  }

  // Verify user has access
  const companyUser = await db.companyUser.findUnique({
    where: {
      companyId_userId: {
        companyId: doc.batch.companyId,
        userId: user.id,
      },
    },
  });

  if (!companyUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Delete the document
  await db.documentFile.delete({
    where: { id },
  });

  // Update batch file count
  await db.uploadBatch.update({
    where: { id: doc.batchId },
    data: { totalFiles: { decrement: 1 } },
  });

  // Log deletion
  await db.auditLog.create({
    data: {
      companyId: doc.batch.companyId,
      companyUserId: companyUser.id,
      action: "delete_document",
      resource: "DocumentFile",
      resourceId: id,
      details: JSON.stringify({
        fileName: doc.fileName,
      }),
    },
  });

  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/docx/documents/[id]
 * Update document extracted data (manual field mapping)
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as {
    extractedData?: Record<string, unknown>;
    status?: string;
  };

  const doc = await db.documentFile.findUnique({
    where: { id },
    include: { batch: true },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Verify access
  const companyUser = await db.companyUser.findUnique({
    where: {
      companyId_userId: {
        companyId: doc.batch.companyId,
        userId: user.id,
      },
    },
  });

  if (!companyUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const updated = await db.documentFile.update({
    where: { id },
    data: {
      extractedData: body.extractedData ? JSON.stringify(body.extractedData) : undefined,
      status: body.status || doc.status,
    },
  });

  // Log update
  await db.auditLog.create({
    data: {
      companyId: doc.batch.companyId,
      companyUserId: companyUser.id,
      action: "update_document",
      resource: "DocumentFile",
      resourceId: id,
      details: JSON.stringify({
        fileName: doc.fileName,
        status: body.status || doc.status,
      }),
    },
  });

  return NextResponse.json({ updated });
}
