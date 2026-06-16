import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const comments = await db.comment.findMany({
    where: { targetType: "writeup", targetId: slug },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { handle: true, displayName: true } } },
  });
  return NextResponse.json({ ok: true, comments });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to comment." }, { status: 401 });

  if (rateLimit(`comment:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many comments." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const { text } = body as { text?: string };
  if (!text || typeof text !== "string" || text.trim().length < 2 || text.length > 2000) {
    return NextResponse.json({ ok: false, error: "Comment must be 2–2000 characters." }, { status: 400 });
  }

  const { slug } = await params;
  const comment = await db.comment.create({
    data: {
      userId: user.id,
      body: text.trim(),
      targetType: "writeup",
      targetId: slug,
    },
    include: { user: { select: { handle: true, displayName: true } } },
  });

  // Notify other commenters (distinct users who commented on same writeup, excluding self)
  const prevCommenters = await db.comment.findMany({
    where: { targetType: "writeup", targetId: slug, userId: { not: user.id } },
    select: { userId: true },
    distinct: ["userId"],
    take: 10,
  });
  if (prevCommenters.length > 0) {
    await db.notification.createMany({
      data: prevCommenters.map((c) => ({
        userId: c.userId,
        kind: "comment",
        body: `@${user.handle} also commented on a writeup you follow`,
        link: `/writeups/${slug}`,
      })),
      skipDuplicates: true,
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, comment });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Comment id required." }, { status: 400 });

  const { slug } = await params;
  const comment = await db.comment.findUnique({ where: { id } });
  if (!comment || comment.targetId !== slug || comment.userId !== user.id) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  await db.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
