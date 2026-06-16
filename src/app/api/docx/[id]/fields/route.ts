import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

async function getOwnedSession(id: string, userId: string) {
  const s = await db.docxSession.findUnique({ where: { id } });
  return s?.userId === userId ? s : null;
}

/* GET /api/docx/[id]/fields */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!await getOwnedSession(id, user.id))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fields = await db.docxField.findMany({
    where: { sessionId: id },
    orderBy: { position: "asc" },
  });
  return NextResponse.json({ fields });
}

/* POST /api/docx/[id]/fields — create a field */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!await getOwnedSession(id, user.id))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    name: string; value?: string; dataType?: string;
    encrypted?: boolean; required?: boolean; isPii?: boolean; position?: number;
  };

  /* Get max position */
  const last = await db.docxField.findFirst({
    where: { sessionId: id }, orderBy: { position: "desc" }, select: { position: true },
  });

  const field = await db.docxField.create({
    data: {
      sessionId: id,
      name:      body.name,
      value:     body.value     ?? "",
      dataType:  body.dataType  ?? "text",
      encrypted: body.encrypted ?? false,
      required:  body.required  ?? false,
      isPii:     body.isPii     ?? false,
      position:  body.position  ?? (last ? last.position + 1 : 0),
      source:    "manual",
    },
  });

  return NextResponse.json({ field }, { status: 201 });
}
