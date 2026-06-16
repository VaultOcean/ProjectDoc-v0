import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/docx/batches/[id]
 * Get batch details with documents
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const batch = await db.uploadBatch.findUnique({
    where: { id },
    include: {
      documentType: { select: { name: true } },
      storageBackend: { select: { name: true, type: true } },
      documents: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fileName: true,
          fileType: true,
          fileSizeKb: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!batch) {
    return NextResponse.json(
      { error: "Batch not found" },
      { status: 404 }
    );
  }

  // Verify user has access
  const companyUser = await db.companyUser.findUnique({
    where: {
      companyId_userId: {
        companyId: batch.companyId,
        userId: user.id,
      },
    },
  });

  if (!companyUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json(batch);
}
