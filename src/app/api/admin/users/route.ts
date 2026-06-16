import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function checkAdmin(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("x-admin-secret");
  return auth === secret;
}

export async function GET(req: Request) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      handle: true,
      email: true,
      fathoms: true,
      streakDays: true,
      createdAt: true,
      lastActiveOn: true,
      _count: { select: { solves: true, docs: true } },
    },
  });
  return NextResponse.json({ ok: true, users });
}

// One-time migration: mark all pre-verification users as verified
export async function PATCH(req: Request) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }
  const result = await db.user.updateMany({
    where: { emailVerifiedAt: null },
    data: { emailVerifiedAt: new Date() },
  });
  return NextResponse.json({ ok: true, updated: result.count });
}

export async function DELETE(req: Request) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }
  const { id } = body as { id?: string };
  if (!id) return NextResponse.json({ ok: false, error: "Provide user id." }, { status: 400 });

  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
