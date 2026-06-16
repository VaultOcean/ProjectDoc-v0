import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });

  const { handle } = await params;
  const target = await db.user.findUnique({ where: { handle }, select: { id: true } });
  if (!target) return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  if (target.id === me.id) return NextResponse.json({ ok: false, error: "Cannot follow yourself." }, { status: 400 });

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: me.id, followingId: target.id } },
  });

  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
    const count = await db.follow.count({ where: { followingId: target.id } });
    return NextResponse.json({ ok: true, following: false, followers: count });
  } else {
    await db.follow.create({ data: { followerId: me.id, followingId: target.id } });
    // Notify the followed user
    await db.notification.create({
      data: {
        userId: target.id,
        kind: "follow",
        body: `@${me.handle} started following you`,
        link: `/profile/${me.handle}`,
      },
    }).catch(() => null);
    const count = await db.follow.count({ where: { followingId: target.id } });
    return NextResponse.json({ ok: true, following: true, followers: count });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  const me = await getCurrentUser();
  const { handle } = await params;
  const target = await db.user.findUnique({ where: { handle }, select: { id: true } });
  if (!target) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const [followers, following, isFollowing] = await Promise.all([
    db.follow.count({ where: { followingId: target.id } }),
    db.follow.count({ where: { followerId: target.id } }),
    me ? db.follow.findUnique({
      where: { followerId_followingId: { followerId: me.id, followingId: target.id } },
    }) : null,
  ]);

  return NextResponse.json({ ok: true, followers, following, isFollowing: !!isFollowing });
}
