import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

async function getOwnedField(sessionId: string, fieldId: string, userId: string) {
  const session = await db.docxSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId) return null;
  return db.docxField.findUnique({ where: { id: fieldId, sessionId } });
}

/* PATCH /api/docx/[id]/fields/[fieldId] */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, fieldId } = await params;
  const existing = await getOwnedField(id, fieldId, user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    name?: string; value?: string; dataType?: string;
    encrypted?: boolean; required?: boolean; isPii?: boolean; position?: number;
  };

  const field = await db.docxField.update({
    where: { id: fieldId },
    data: {
      ...(body.name      !== undefined && { name: body.name }),
      ...(body.value     !== undefined && { value: body.value }),
      ...(body.dataType  !== undefined && { dataType: body.dataType }),
      ...(body.encrypted !== undefined && { encrypted: body.encrypted }),
      ...(body.required  !== undefined && { required: body.required }),
      ...(body.isPii     !== undefined && { isPii: body.isPii }),
      ...(body.position  !== undefined && { position: body.position }),
    },
  });

  return NextResponse.json({ field });
}

/* DELETE /api/docx/[id]/fields/[fieldId] */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, fieldId } = await params;
  const existing = await getOwnedField(id, fieldId, user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.docxField.delete({ where: { id: fieldId } });
  return NextResponse.json({ ok: true });
}
