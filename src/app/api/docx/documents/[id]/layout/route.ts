import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractPdfLayout } from "@/lib/pdf-extract";

/**
 * GET /api/docx/documents/[id]/layout
 * Return positioned text runs (bounding boxes) for the clickable preview.
 */
export async function GET(
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

  if (doc.fileType !== "application/pdf" || !doc.rawContent) {
    return NextResponse.json({ pages: [] });
  }

  const buffer = Buffer.from(doc.rawContent, "base64");
  const pages = await extractPdfLayout(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    )
  );

  return NextResponse.json({ pages });
}
