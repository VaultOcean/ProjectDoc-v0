import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";

/* ── GET /api/settings/tenant ─────────────────────────────────────────────── */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const config = await db.tenantConfig.findUnique({ where: { userId: user.id } });
  if (!config) return NextResponse.json({ ok: true, config: null });

  return NextResponse.json({
    ok: true,
    config: {
      id:            config.id,
      orgName:       config.orgName,
      serverUrl:     config.serverUrl,
      apiKeyMasked:  config.apiKey ? "•".repeat(8) + config.apiKey.slice(-4) : "",
      hasApiKey:     config.apiKey.length > 0,
      maxFileSizeMb: config.maxFileSizeMb,
      status:        config.status,
      adminNotes:    config.adminNotes,
      createdAt:     config.createdAt,
      updatedAt:     config.updatedAt,
    },
  });
}

/* ── PUT /api/settings/tenant ─────────────────────────────────────────────── */
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  if (rateLimit(`tenant-config:${user.id}`, 10, 60_000))
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });

  const body = (await req.json()) as {
    orgName?: string;
    serverUrl?: string;
    apiKey?: string;
    maxFileSizeMb?: number;
  };

  /* Validate server URL if provided */
  if (body.serverUrl !== undefined && body.serverUrl !== "") {
    try {
      const parsed = new URL(body.serverUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Server URL must be a valid http:// or https:// address." },
        { status: 400 }
      );
    }
  }

  const existing = await db.tenantConfig.findUnique({ where: { userId: user.id } });

  const data = {
    orgName:       body.orgName       ?? existing?.orgName       ?? "",
    serverUrl:     body.serverUrl     ?? existing?.serverUrl     ?? "",
    maxFileSizeMb: body.maxFileSizeMb ?? existing?.maxFileSizeMb ?? 25,
    /* Only update apiKey if a non-empty value was submitted */
    ...(body.apiKey && body.apiKey.trim() ? { apiKey: body.apiKey.trim() } : {}),
    /* Any URL or key change resets to pending for re-approval */
    ...(
      (body.serverUrl !== undefined && body.serverUrl !== existing?.serverUrl) ||
      (body.apiKey   !== undefined && body.apiKey.trim())
        ? { status: "pending" }
        : {}
    ),
  };

  const config = await db.tenantConfig.upsert({
    where:  { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  const resetToReview =
    (body.serverUrl !== undefined && body.serverUrl !== existing?.serverUrl) ||
    (body.apiKey   !== undefined && body.apiKey.trim().length > 0);

  return NextResponse.json({
    ok: true,
    status:      config.status,
    resetToReview,
  });
}
