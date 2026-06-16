import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { awardActivity } from "@/lib/progress";
import { rateLimit, clientIp } from "@/lib/ratelimit";

const READ_FATHOMS = 10;

export async function POST(req: Request) {
  if (rateLimit(`read:${clientIp(req)}`, 30, 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const slug = (body as { slug?: unknown })?.slug;
  if (typeof slug !== "string" || slug.length > 200) {
    return NextResponse.json({ ok: false, error: "slug required." }, { status: 400 });
  }

  const writeup = await db.writeup.findUnique({ where: { slug } });
  if (!writeup) return NextResponse.json({ ok: false, error: "Unknown writeup." }, { status: 404 });

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in to record this." }, { status: 401 });
  }

  const already = await db.activity.findFirst({
    where: { userId: user.id, kind: "read", ref: slug },
  });
  if (already) {
    return NextResponse.json({ ok: true, recorded: false, message: "Already counted." });
  }

  const updated = await awardActivity(user.id, "read", READ_FATHOMS, slug);
  return NextResponse.json({
    ok: true,
    recorded: true,
    message: `Counted. +${READ_FATHOMS} fathoms.`,
    fathoms: updated.fathoms,
    streakDays: updated.streakDays,
  });
}
