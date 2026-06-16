import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ── GET /api/health ──────────────────────────────────────────────────────────
   Database connectivity test. Returns row counts for core models.
   No auth required — used for infrastructure health monitoring.
─────────────────────────────────────────────────────────────────────────────── */
export async function GET() {
  const start = Date.now();

  try {
    const [users, docs, targets, reports, submissions] = await Promise.all([
      db.user.count(),
      db.doc.count(),
      db.target.count(),
      db.vulnReport.count(),
      db.bountySubmission.count(),
    ]);

    return NextResponse.json({
      ok: true,
      db: "connected",
      latencyMs: Date.now() - start,
      counts: { users, docs, targets, reports, submissions },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        db: "error",
        error: err instanceof Error ? err.message : "Unknown DB error",
        latencyMs: Date.now() - start,
      },
      { status: 503 }
    );
  }
}
