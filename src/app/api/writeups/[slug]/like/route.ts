import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to like." }, { status: 401 });

  const { slug } = await params;
  const existing = await db.like.findUnique({
    where: { userId_targetType_targetId: { userId: user.id, targetType: "writeup", targetId: slug } },
  });

  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
    const count = await db.like.count({ where: { targetType: "writeup", targetId: slug } });
    return NextResponse.json({ ok: true, liked: false, count });
  } else {
    await db.like.create({ data: { userId: user.id, targetType: "writeup", targetId: slug } });
    const count = await db.like.count({ where: { targetType: "writeup", targetId: slug } });
    return NextResponse.json({ ok: true, liked: true, count });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getCurrentUser();
  const { slug } = await params;

  const count = await db.like.count({ where: { targetType: "writeup", targetId: slug } });
  const liked = user
    ? !!(await db.like.findUnique({
        where: { userId_targetType_targetId: { userId: user.id, targetType: "writeup", targetId: slug } },
      }))
    : false;

  return NextResponse.json({ ok: true, liked, count });
}
