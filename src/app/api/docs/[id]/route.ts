import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { readMinutes } from "@/lib/queries";
import { awardActivity } from "@/lib/progress";

const MAX_TITLE = 200;
const MAX_SUMMARY = 400;
const MAX_CONTENT = 100_000;

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });

  const owned = await db.doc.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const data: Record<string, unknown> = {};
  if (typeof b.title === "string") data.title = b.title.slice(0, MAX_TITLE) || "Untitled";
  if (typeof b.summary === "string") data.summary = b.summary.slice(0, MAX_SUMMARY);
  if (typeof b.content === "string") {
    if (b.content.length > MAX_CONTENT) return NextResponse.json({ ok: false, error: "Document too large." }, { status: 413 });
    data.content = b.content;
    data.readMinutes = readMinutes(b.content);
  }
  const prevDoc = b.visibility === "public"
    ? await db.doc.findFirst({ where: { id, userId: user.id }, select: { visibility: true } })
    : null;

  if (b.visibility === "private" || b.visibility === "public") data.visibility = b.visibility;

  const updated = await db.doc.update({
    where: { id },
    data,
    select: { id: true, slug: true, visibility: true, updatedAt: true },
  });
  // Award +50ƒ the first time a doc goes public
  if (prevDoc?.visibility === "private" && updated.visibility === "public") {
    await awardActivity(user.id, "publish", 50, updated.id).catch(() => null);
  }

  return NextResponse.json({ ok: true, doc: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });

  const res = await db.doc.deleteMany({ where: { id, userId: user.id } });
  if (res.count === 0) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
