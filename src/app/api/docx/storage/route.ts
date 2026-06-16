import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/docx/storage?companyId=...
 * List storage backends for a company (verified access)
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

  const backends = await db.storageBackend.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      type: true,
      testPassed: true,
      testedAt: true,
      createdAt: true,
      _count: { select: { documentTypes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ backends });
}

/**
 * POST /api/docx/storage
 * Create a new storage backend (admin only)
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    companyId: string;
    name: string;
    type: "postgresql" | "oracle" | "mysql" | "mongodb" | "s3" | "gcs";
    configEncrypted: string; // JSON string (encrypted in production)
  };

  // Verify user is admin
  const companyUser = await db.companyUser.findUnique({
    where: { companyId_userId: { companyId: body.companyId, userId: user.id } },
    include: { role: true },
  });

  if (!companyUser || companyUser.role.level > 1) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Check if name already exists
  const existing = await db.storageBackend.findFirst({
    where: { companyId: body.companyId, name: body.name },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Storage backend with this name already exists" },
      { status: 409 }
    );
  }

  const backend = await db.storageBackend.create({
    data: {
      companyId: body.companyId,
      name: body.name,
      type: body.type,
      configEncrypted: body.configEncrypted,
    },
  });

  return NextResponse.json({ backend }, { status: 201 });
}
