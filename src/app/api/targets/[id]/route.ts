import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const target = await db.target.findFirst({
    where: { id, userId: user.id },
    include: {
      recons: { orderBy: { createdAt: "desc" }, take: 50 },
      reports: { orderBy: { createdAt: "desc" } },
      submissions: { orderBy: { submittedAt: "desc" } },
    },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ target });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await db.target.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as {
    name?: string; program?: string; platform?: string;
    scope?: string[]; outScope?: string[]; notes?: string; status?: string;
  };

  const updated = await db.target.update({
    where: { id },
    data: {
      name: body.name?.trim() ?? existing.name,
      program: body.program !== undefined ? body.program.trim() : existing.program,
      platform: body.platform !== undefined ? body.platform.trim() : existing.platform,
      scope: body.scope !== undefined ? JSON.stringify(body.scope) : existing.scope,
      outScope: body.outScope !== undefined ? JSON.stringify(body.outScope) : existing.outScope,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      status: body.status ?? existing.status,
    },
  });

  return NextResponse.json({ ok: true, target: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await db.target.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.target.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
