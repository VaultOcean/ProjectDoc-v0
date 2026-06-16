import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Confirm the doc belongs to the user
  const doc = await db.doc.findFirst({
    where: { id, userId: user.id },
    select: { title: true },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Find all other docs belonging to this user that mention [[doc.title]]
  const allDocs = await db.doc.findMany({
    where: { userId: user.id, NOT: { id } },
    select: { id: true, title: true, slug: true, updatedAt: true, content: true },
  });

  const titleLower = doc.title.toLowerCase();
  const pattern = `[[${titleLower}]]`;

  const backlinks = allDocs
    .filter((d) => d.content.toLowerCase().includes(pattern))
    .map(({ content: _, ...rest }) => rest); // strip content from response

  return NextResponse.json({ backlinks, docTitle: doc.title });
}
