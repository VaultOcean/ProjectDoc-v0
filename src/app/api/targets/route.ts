import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targets = await db.target.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { recons: true, reports: true, submissions: true } },
    },
  });

  return NextResponse.json({ targets });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    domain?: string; name?: string; program?: string; platform?: string;
    scope?: string[]; outScope?: string[]; notes?: string;
  };

  const domain = String(body.domain ?? "").trim().toLowerCase()
    .replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!domain) return NextResponse.json({ error: "Domain is required." }, { status: 400 });

  const existing = await db.target.findUnique({ where: { userId_domain: { userId: user.id, domain } } });
  if (existing) return NextResponse.json({ error: "Target already exists.", id: existing.id }, { status: 409 });

  const target = await db.target.create({
    data: {
      userId: user.id,
      domain,
      name: body.name?.trim() ?? "",
      program: body.program?.trim() ?? "",
      platform: body.platform?.trim() ?? "",
      scope: JSON.stringify(body.scope ?? []),
      outScope: JSON.stringify(body.outScope ?? []),
      notes: body.notes?.trim() ?? "",
    },
  });

  return NextResponse.json({ ok: true, target });
}
