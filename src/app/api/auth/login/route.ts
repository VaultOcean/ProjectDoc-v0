import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession, validateCredentials } from "@/lib/auth";
import { rateLimitAsync, clientIp } from "@/lib/ratelimit";

export async function POST(req: Request) {
  if (await rateLimitAsync(`login:${clientIp(req)}`, 8, 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Slow down." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const v = validateCredentials(body as Record<string, unknown>);
  if ("error" in v) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: v.email } });
  const dummy = "$2a$12$abcdefghijklmnopqrstuv0123456789012345678901234567890ab";
  const ok = user
    ? await verifyPassword(v.password, user.passwordHash)
    : (await verifyPassword(v.password, dummy), false);

  if (!user || !ok) {
    return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
  }

  if (!user.emailVerifiedAt) {
    return NextResponse.json(
      { ok: false, error: "EMAIL_UNVERIFIED", email: v.email },
      { status: 403 }
    );
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true, handle: user.handle });
}
