import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimitAsync, clientIp } from "@/lib/ratelimit";

export async function POST(req: Request) {
  if (await rateLimitAsync(`resend-verify:${clientIp(req)}`, 3, 300_000)) {
    return NextResponse.json({ ok: false, error: "Too many requests. Wait 5 minutes." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const { email } = body as { email?: string };
  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: false, error: "Email required." }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, handle: true, emailVerifiedAt: true },
  });

  // Always return ok to not leak whether the email exists
  if (!user || user.emailVerifiedAt) {
    return NextResponse.json({ ok: true });
  }

  // Expire all existing unused tokens
  await db.verificationToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { expiresAt: new Date() },
  });

  const vt = await db.verificationToken.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await sendVerificationEmail(email.toLowerCase(), user.handle, vt.token);
  return NextResponse.json({ ok: true });
}
