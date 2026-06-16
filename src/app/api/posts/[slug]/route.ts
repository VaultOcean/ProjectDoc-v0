import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/posts/[slug] — single post (published, or own draft)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const me = await getCurrentUser();

  const post = await db.post.findUnique({
    where: { slug },
    include: { author: { select: { handle: true, displayName: true, fathoms: true } } },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (post.status !== "published" && post.userId !== me?.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...post,
    tags: (() => { try { return JSON.parse(post.tags); } catch { return []; } })(),
    isOwner: post.userId === me?.id,
  });
}

// DELETE /api/posts/[slug] — delete own post
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const post = await db.post.findUnique({ where: { slug } });
  if (!post || post.userId !== me.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.post.delete({ where: { slug } });
  return NextResponse.json({ ok: true });
}
