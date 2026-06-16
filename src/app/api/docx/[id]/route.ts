import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/* GET /api/docx/[id] — fetch session + fields */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const session = await db.docxSession.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { position: "asc" } },
    },
  });

  if (!session || session.userId !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ session });
}

/* PATCH /api/docx/[id] — update name / rawText / status */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.docxSession.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    name?: string; rawText?: string; status?: string;
    wordCount?: number; pageCount?: number; errorMsg?: string;
  };

  const session = await db.docxSession.update({
    where: { id },
    data: {
      ...(body.name      !== undefined && { name: body.name }),
      ...(body.rawText   !== undefined && { rawText: body.rawText }),
      ...(body.status    !== undefined && { status: body.status }),
      ...(body.wordCount !== undefined && { wordCount: body.wordCount }),
      ...(body.pageCount !== undefined && { pageCount: body.pageCount }),
      ...(body.errorMsg  !== undefined && { errorMsg: body.errorMsg }),
    },
  });

  return NextResponse.json({ session });
}

/* DELETE /api/docx/[id] */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.docxSession.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.docxSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
