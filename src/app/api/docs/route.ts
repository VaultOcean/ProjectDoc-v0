import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/queries";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
  if (rateLimit(`doc-new:${user.id}`, 20, 60_000))
    return NextResponse.json({ ok: false, error: "Slow down." }, { status: 429 });

  let title = "Untitled";
  let content = "";
  try {
    const body = await req.json() as { title?: string; content?: string };
    if (body.title) title = body.title;
    if (body.content) content = body.content;
  } catch { /* empty body → blank doc */ }

  const doc = await db.doc.create({
    data: { userId: user.id, title, slug: slugify(title), content },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: doc.id });
}
