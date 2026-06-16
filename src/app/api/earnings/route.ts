import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const submissions = await db.bountySubmission.findMany({
    where: { userId: user.id },
    orderBy: { submittedAt: "desc" },
    include: { target: { select: { id: true, domain: true } } },
  });

  const total = submissions.reduce((s, r) => s + (r.bountyUSD ?? 0), 0);
  const resolved = submissions.filter((r) => r.status === "resolved");
  const earned = resolved.reduce((s, r) => s + (r.bountyUSD ?? 0), 0);

  const byPlatform: Record<string, number> = {};
  for (const r of resolved) {
    byPlatform[r.platform] = (byPlatform[r.platform] ?? 0) + (r.bountyUSD ?? 0);
  }

  const bySeverity: Record<string, number> = {};
  for (const r of submissions) {
    bySeverity[r.severity] = (bySeverity[r.severity] ?? 0) + 1;
  }

  return NextResponse.json({ submissions, stats: { total, earned, byPlatform, bySeverity, count: submissions.length } });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    title?: string; platform?: string; program?: string; severity?: string;
    status?: string; bountyUSD?: number; submittedAt?: string; notes?: string; targetId?: string;
  };

  if (!body.title?.trim()) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (!body.platform?.trim()) return NextResponse.json({ error: "Platform is required." }, { status: 400 });
  if (!body.program?.trim()) return NextResponse.json({ error: "Program is required." }, { status: 400 });
  if (!body.severity) return NextResponse.json({ error: "Severity is required." }, { status: 400 });

  const submission = await db.bountySubmission.create({
    data: {
      userId: user.id,
      targetId: body.targetId ?? null,
      title: body.title.trim(),
      platform: body.platform.trim(),
      program: body.program.trim(),
      severity: body.severity,
      status: body.status ?? "submitted",
      bountyUSD: body.bountyUSD ?? null,
      submittedAt: body.submittedAt ? new Date(body.submittedAt) : new Date(),
      notes: body.notes ?? "",
    },
  });

  return NextResponse.json({ ok: true, submission });
}
