import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ writeups: [], challenges: [], users: [], docs: [] });

  const [writeups, challenges, users, docs] = await Promise.all([
    db.writeup.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { author: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { slug: true, title: true, summary: true, category: true, severity: true, readMinutes: true },
      take: 6,
    }),
    db.challenge.findMany({
      where: {
        active: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { prompt: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { slug: true, title: true, category: true, difficulty: true, fathoms: true },
      take: 6,
    }),
    db.user.findMany({
      where: {
        emailVerifiedAt: { not: null },
        OR: [
          { handle: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { handle: true, displayName: true, fathoms: true, streakDays: true },
      take: 6,
    }),
    db.doc.findMany({
      where: {
        visibility: "public",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        slug: true,
        title: true,
        summary: true,
        readMinutes: true,
        author: { select: { handle: true, displayName: true } },
      },
      take: 6,
    }),
  ]);

  return NextResponse.json({ writeups, challenges, users, docs });
}
