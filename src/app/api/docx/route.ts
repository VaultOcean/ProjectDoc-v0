import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";

/* GET /api/docx — list user's sessions */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await db.docxSession.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, name: true, fileName: true, fileType: true,
      fileSizeMb: true, status: true, wordCount: true, createdAt: true, updatedAt: true,
      _count: { select: { fields: true } },
    },
  });

  return NextResponse.json({ sessions });
}

/* POST /api/docx — create a new session */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blocked = rateLimit(`docx:create:${user.id}`, 20, 60_000);
  if (blocked) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await req.json() as {
    name?: string; fileName?: string; fileType?: string; fileSizeMb?: number;
  };

  const session = await db.docxSession.create({
    data: {
      userId:    user.id,
      name:      body.name      || "Untitled document",
      fileName:  body.fileName  || "",
      fileType:  body.fileType  || "",
      fileSizeMb: body.fileSizeMb || 0,
      status:    "uploaded",
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}
