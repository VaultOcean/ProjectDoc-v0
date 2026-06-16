import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const bookmarks = await db.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ ok: true, bookmarks });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to bookmark." }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const { targetType, targetId } = body as { targetType?: string; targetId?: string };
  if (!targetType || !targetId) {
    return NextResponse.json({ ok: false, error: "targetType and targetId required." }, { status: 400 });
  }

  const existing = await db.bookmark.findUnique({
    where: { userId_targetType_targetId: { userId: user.id, targetType, targetId } },
  });

  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, bookmarked: false });
  } else {
    await db.bookmark.create({ data: { userId: user.id, targetType, targetId } });
    return NextResponse.json({ ok: true, bookmarked: true });
  }
}
