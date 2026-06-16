import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const VALID_KINDS = ["subdomains", "dns", "ip", "wayback", "headers", "scan"] as const;

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const target = await db.target.findFirst({ where: { id, userId: user.id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as { kind?: string; data?: unknown };
  if (!body.kind || !VALID_KINDS.includes(body.kind as typeof VALID_KINDS[number])) {
    return NextResponse.json({ error: `kind must be one of: ${VALID_KINDS.join(", ")}` }, { status: 400 });
  }
  if (!body.data) return NextResponse.json({ error: "data is required" }, { status: 400 });

  const recon = await db.targetRecon.create({
    data: {
      targetId: id,
      kind: body.kind,
      data: JSON.stringify(body.data),
    },
  });

  await db.target.update({ where: { id }, data: { updatedAt: new Date() } });

  return NextResponse.json({ ok: true, recon });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const target = await db.target.findFirst({ where: { id, userId: user.id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const recons = await db.targetRecon.findMany({
    where: { targetId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ recons });
}
