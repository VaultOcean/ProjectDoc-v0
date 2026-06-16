import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimitAsync } from "@/lib/ratelimit";
import { analyzeCsp } from "@/lib/analyze";

export const runtime = "nodejs";

const WEIGHT: Record<string, number> = { critical: 30, high: 18, medium: 10, low: 4, info: 0, good: 0 };

function gradeFor(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (await rateLimitAsync(`csp:${ip}`, 30, 60_000)) {
    return NextResponse.json({ ok: false, error: "Rate limit hit." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const header = (body as { header?: unknown })?.header;
  if (typeof header !== "string" || header.length > 4096) {
    return NextResponse.json({ ok: false, error: "Provide a CSP header string." }, { status: 400 });
  }

  const report = analyzeCsp(header.trim());

  let score = 100;
  for (const f of report.findings) score -= (WEIGHT[f.severity] ?? 0);
  score = Math.max(0, Math.min(100, score));

  return NextResponse.json({ ok: true, grade: gradeFor(score), score, ...report });
}
