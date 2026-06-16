import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const report = await db.vulnReport.findFirst({
    where: { id, userId: user.id },
    include: { target: { select: { id: true, domain: true, name: true } } },
  });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ report });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await db.vulnReport.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const updated = await db.vulnReport.update({
    where: { id },
    data: {
      title:        typeof body.title === "string"        ? body.title.trim()       : undefined,
      targetId:     body.targetId !== undefined            ? (body.targetId as string | null) : undefined,
      severity:     typeof body.severity === "string"     ? body.severity           : undefined,
      cvssVector:   typeof body.cvssVector === "string"   ? body.cvssVector         : undefined,
      cvssScore:    typeof body.cvssScore === "number"    ? body.cvssScore          : undefined,
      endpoint:     typeof body.endpoint === "string"     ? body.endpoint           : undefined,
      parameter:    typeof body.parameter === "string"    ? body.parameter          : undefined,
      poc:          typeof body.poc === "string"          ? body.poc                : undefined,
      impact:       typeof body.impact === "string"       ? body.impact             : undefined,
      remediation:  typeof body.remediation === "string"  ? body.remediation        : undefined,
      httpRequest:  typeof body.httpRequest === "string"  ? body.httpRequest        : undefined,
      httpResponse: typeof body.httpResponse === "string" ? body.httpResponse       : undefined,
      status:       typeof body.status === "string"       ? body.status             : undefined,
      platform:     typeof body.platform === "string"     ? body.platform           : undefined,
      programName:  typeof body.programName === "string"  ? body.programName        : undefined,
      bountyUSD:    typeof body.bountyUSD === "number"    ? body.bountyUSD          : undefined,
      submittedAt:  body.status === "submitted" && !existing.submittedAt ? new Date() : undefined,
      resolvedAt:   body.status === "resolved"  && !existing.resolvedAt  ? new Date() : undefined,
    },
  });

  return NextResponse.json({ ok: true, report: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await db.vulnReport.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.vulnReport.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
