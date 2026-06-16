import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/docx/document-types?companyId=...
 * List document types for a company (verified access)
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json({ error: "companyId required" }, { status: 400 });
  }

  // Verify user has access to this company
  const companyUser = await db.companyUser.findUnique({
    where: { companyId_userId: { companyId, userId: user.id } },
  });

  if (!companyUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const types = await db.documentType.findMany({
    where: { companyId },
    include: {
      storageBackend: { select: { name: true } },
      _count: { select: { batches: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ types });
}

/**
 * POST /api/docx/document-types
 * Create a new document type (admin+ only)
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    companyId: string;
    name: string;
    description?: string;
    fieldDefs: Array<{
      name: string;
      type: string;
      required?: boolean;
      position: number;
    }>;
    storageBackendId?: string;
  };

  // Verify user is admin in this company
  const companyUser = await db.companyUser.findUnique({
    where: { companyId_userId: { companyId: body.companyId, userId: user.id } },
    include: { role: true },
  });

  if (!companyUser || companyUser.role.level > 1) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Generate slug from name
  const slug = body.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  // Check if slug already exists in this company
  const existing = await db.documentType.findFirst({
    where: { companyId: body.companyId, slug },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Document type with this name already exists" },
      { status: 409 }
    );
  }

  const docType = await db.documentType.create({
    data: {
      companyId: body.companyId,
      name: body.name,
      slug,
      description: body.description || "",
      fieldDefs: JSON.stringify(body.fieldDefs || []),
      storageBackendId: body.storageBackendId,
    },
  });

  return NextResponse.json({ docType }, { status: 201 });
}
