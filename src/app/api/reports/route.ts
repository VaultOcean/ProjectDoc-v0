import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const where = {
    userId: user.id,
    ...(status ? { status } : {}),
  };

  const reports = await db.vulnReport.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { target: { select: { id: true, domain: true, name: true } } },
  });

  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    title?: string; targetId?: string; severity?: string;
    cvssVector?: string; cvssScore?: number; endpoint?: string;
    parameter?: string; poc?: string; impact?: string; remediation?: string;
    httpRequest?: string; httpResponse?: string; status?: string;
    platform?: string; programName?: string; bountyUSD?: number;
  };

  if (!body.title?.trim()) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const VALID_SEVERITIES = ["critical", "high", "medium", "low", "info"];
  if (body.severity && !VALID_SEVERITIES.includes(body.severity)) {
    return NextResponse.json({ error: "Invalid severity." }, { status: 400 });
  }

  if (body.targetId) {
    const t = await db.target.findFirst({ where: { id: body.targetId, userId: user.id } });
    if (!t) return NextResponse.json({ error: "Target not found." }, { status: 404 });
  }

  const report = await db.vulnReport.create({
    data: {
      userId: user.id,
      targetId: body.targetId ?? null,
      title: body.title.trim(),
      severity: body.severity ?? "medium",
      cvssVector: body.cvssVector ?? "",
      cvssScore: body.cvssScore ?? 0,
      endpoint: body.endpoint ?? "",
      parameter: body.parameter ?? "",
      poc: body.poc ?? "",
      impact: body.impact ?? "",
      remediation: body.remediation ?? "",
      httpRequest: body.httpRequest ?? "",
      httpResponse: body.httpResponse ?? "",
      status: body.status ?? "draft",
      platform: body.platform ?? "",
      programName: body.programName ?? "",
      bountyUSD: body.bountyUSD ?? null,
    },
  });

  return NextResponse.json({ ok: true, report });
}
