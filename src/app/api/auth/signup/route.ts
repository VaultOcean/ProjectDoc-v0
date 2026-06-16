import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, validateCredentials } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimitAsync, clientIp } from "@/lib/ratelimit";

export async function POST(req: Request) {
  if (await rateLimitAsync(`signup:${clientIp(req)}`, 5, 60_000)) {
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

  const handle = v.handle!;
  const displayNameRaw = (body as { displayName?: unknown }).displayName;
  const displayName =
    typeof displayNameRaw === "string" && displayNameRaw.trim().length > 0
      ? displayNameRaw.trim().slice(0, 60)
      : handle;

  const existing = await db.user.findFirst({
    where: { OR: [{ email: v.email }, { handle }] },
    select: { email: true, handle: true },
  });
  if (existing) {
    const field = existing.email === v.email ? "email" : "handle";
    return NextResponse.json({ ok: false, error: `That ${field} is already taken.` }, { status: 409 });
  }

  const user = await db.user.create({
    data: { email: v.email, handle, displayName, passwordHash: await hashPassword(v.password) },
    select: { id: true, handle: true },
  });

  const vt = await db.verificationToken.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await sendVerificationEmail(v.email, handle, vt.token);

  return NextResponse.json({ ok: true, verify: true, handle: user.handle });
}
