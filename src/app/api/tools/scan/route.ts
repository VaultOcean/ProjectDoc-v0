import { NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { safeFetch } from "@/lib/ssrf";
import { analyzeHeaders } from "@/lib/analyze";

export const runtime = "nodejs";
export const maxDuration = 20;

const HOST_RE = /^[a-z0-9.-]{1,253}$/i;

function parseTarget(raw: string): { host: string; url: string } | null {
  let input = raw.trim().toLowerCase();
  if (!input) return null;
  if (!/^https?:\/\//.test(input)) input = "https://" + input;
  let u: URL;
  try { u = new URL(input); } catch { return null; }
  const host = u.hostname.replace(/\.$/, "");
  if (!HOST_RE.test(host) || !host.includes(".")) return null;
  return { host, url: `${u.protocol}//${host}` };
}

// Public endpoint — no auth, IP rate-limited, no DB write
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (rateLimit(`tool-scan:${ip}`, 6, 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many scans. Wait a minute." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const targetRaw = (body as { target?: unknown })?.target;
  if (typeof targetRaw !== "string" || targetRaw.length > 253) {
    return NextResponse.json({ ok: false, error: "Provide a domain to scan." }, { status: 400 });
  }

  const parsed = parseTarget(targetRaw);
  if (!parsed) return NextResponse.json({ ok: false, error: "Invalid domain." }, { status: 400 });

  let fetched;
  try {
    fetched = await safeFetch(parsed.url);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Could not reach target." },
      { status: 422 }
    );
  }

  const report = analyzeHeaders(fetched.headers);
  return NextResponse.json({
    ok: true,
    target: parsed.host,
    finalUrl: fetched.finalUrl,
    grade: report.grade,
    score: report.score,
    findings: report.findings,
    present: report.present,
  });
}
