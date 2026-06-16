import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await db.bountySubmission.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const updated = await db.bountySubmission.update({
    where: { id },
    data: {
      title:       typeof body.title === "string"       ? body.title.trim()  : undefined,
      platform:    typeof body.platform === "string"    ? body.platform      : undefined,
      program:     typeof body.program === "string"     ? body.program       : undefined,
      severity:    typeof body.severity === "string"    ? body.severity      : undefined,
      status:      typeof body.status === "string"      ? body.status        : undefined,
      bountyUSD:   typeof body.bountyUSD === "number"   ? body.bountyUSD     : undefined,
      notes:       typeof body.notes === "string"       ? body.notes         : undefined,
      resolvedAt:  body.status === "resolved" && !existing.resolvedAt ? new Date() : undefined,
    },
  });

  return NextResponse.json({ ok: true, submission: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await db.bountySubmission.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.bountySubmission.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
