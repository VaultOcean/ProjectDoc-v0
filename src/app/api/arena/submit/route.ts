import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { awardActivity } from "@/lib/progress";
import { rateLimit, clientIp } from "@/lib/ratelimit";

const MAX_FLAG_LEN = 256;

/** Constant-time compare of the submitted flag's hash against the stored hash. */
function flagMatches(submitted: string, storedHashHex: string): boolean {
  const submittedHash = crypto.createHash("sha256").update(submitted).digest();
  let storedHash: Buffer;
  try {
    storedHash = Buffer.from(storedHashHex, "hex");
  } catch {
    return false;
  }
  if (storedHash.length !== submittedHash.length) return false;
  return crypto.timingSafeEqual(submittedHash, storedHash);
}

export async function POST(req: Request) {
  if (rateLimit(`flag:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Slow down." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const slug = (body as { slug?: unknown })?.slug;
  const flag = (body as { flag?: unknown })?.flag;
  if (typeof slug !== "string" || typeof flag !== "string") {
    return NextResponse.json({ ok: false, error: "slug and flag are required." }, { status: 400 });
  }
  if (flag.length === 0 || flag.length > MAX_FLAG_LEN) {
    return NextResponse.json({ ok: false, error: "Invalid flag length." }, { status: 400 });
  }

  const challenge = await db.challenge.findUnique({ where: { slug } });
  if (!challenge) {
    return NextResponse.json({ ok: false, error: "Unknown challenge." }, { status: 404 });
  }
  if (!challenge.active) {
    return NextResponse.json({ ok: false, error: "This challenge isn't live yet." }, { status: 403 });
  }

  if (!flagMatches(flag.trim(), challenge.flagHash)) {
    return NextResponse.json({ ok: false, error: "Not quite. Keep digging." });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({
      ok: true,
      recorded: false,
      message: "Correct! Sign in to record the solve and earn fathoms.",
    });
  }

  const already = await db.solve.findUnique({
    where: { userId_challengeId: { userId: user.id, challengeId: challenge.id } },
  });
  if (already) {
    return NextResponse.json({ ok: true, recorded: false, message: "Already solved — nice." });
  }

  await db.solve.create({ data: { userId: user.id, challengeId: challenge.id } });
  const updated = await awardActivity(user.id, "solve", challenge.fathoms, challenge.slug);

  return NextResponse.json({
    ok: true,
    recorded: true,
    message: `Flag accepted. +${challenge.fathoms} fathoms.`,
    fathoms: updated.fathoms,
    streakDays: updated.streakDays,
  });
}
