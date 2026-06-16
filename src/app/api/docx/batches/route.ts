import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/docx/batches?companyId=...
 * List upload batches for a company
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json({ error: "companyId required" }, { status: 400 });
  }

  // Verify user has access
  const companyUser = await db.companyUser.findUnique({
    where: { companyId_userId: { companyId, userId: user.id } },
  });

  if (!companyUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const batches = await db.uploadBatch.findMany({
    where: { companyId },
    include: {
      documentType: { select: { name: true } },
      createdByUser: { select: { user: { select: { displayName: true, email: true } } } },
      _count: { select: { documents: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ batches });
}

/**
 * POST /api/docx/batches
 * Create a new upload batch
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    companyId: string;
    documentTypeId: string;
    storageBackendId: string;
    name: string;
  };

  // Verify user has access and can upload
  const companyUser = await db.companyUser.findUnique({
    where: { companyId_userId: { companyId: body.companyId, userId: user.id } },
  });

  if (!companyUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Verify document type exists in this company
  const docType = await db.documentType.findUnique({
    where: { id: body.documentTypeId },
  });

  if (!docType || docType.companyId !== body.companyId) {
    return NextResponse.json(
      { error: "Document type not found" },
      { status: 404 }
    );
  }

  const batch = await db.uploadBatch.create({
    data: {
      companyId: body.companyId,
      documentTypeId: body.documentTypeId,
      storageBackendId: body.storageBackendId,
      name: body.name,
      createdByUserId: companyUser.id,
      status: "uploading",
    },
    include: {
      documentType: { select: { name: true } },
      createdByUser: { select: { user: { select: { displayName: true, email: true } } } },
    },
  });

  return NextResponse.json({ batch }, { status: 201 });
}
