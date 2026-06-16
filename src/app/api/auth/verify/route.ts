import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") ?? "";

  if (!token) {
    return NextResponse.redirect(new URL("/login?msg=invalid_token", req.url));
  }

  const vt = await db.verificationToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, handle: true } } },
  });

  if (!vt || vt.usedAt || vt.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/login?msg=link_expired", req.url));
  }

  await db.$transaction([
    db.verificationToken.update({ where: { id: vt.id }, data: { usedAt: new Date() } }),
    db.user.update({ where: { id: vt.userId }, data: { emailVerifiedAt: new Date() } }),
  ]);

  await createSession(vt.userId);
  return NextResponse.redirect(new URL("/?verified=1", req.url));
}
