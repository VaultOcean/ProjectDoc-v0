import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { safeFetch } from "@/lib/ssrf";
import { analyzeHeaders, analyzeCsp } from "@/lib/analyze";
import { dnsRecords, discoverSubdomains } from "@/lib/recon";

export const runtime = "nodejs";
export const maxDuration = 30;

const HOST_RE = /^[a-z0-9.-]{1,253}$/i;

function parseTarget(raw: string): { host: string; url: string } | null {
  let input = raw.trim().toLowerCase();
  if (!input) return null;
  if (!/^https?:\/\//.test(input)) input = "https://" + input;
  let u: URL;
  try {
    u = new URL(input);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/\.$/, "");
  if (!HOST_RE.test(host) || !host.includes(".")) return null;
  return { host, url: `${u.protocol}//${host}` };
}

function apexOf(host: string): string {
  const parts = host.split(".");
  return parts.length > 2 ? parts.slice(-2).join(".") : host;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to run a scan." }, { status: 401 });

  if (rateLimit(`scan:${user.id}`, 12, 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many scans. Give it a minute." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }
  const targetRaw = (body as { target?: unknown })?.target;
  if (typeof targetRaw !== "string" || targetRaw.length > 253) {
    return NextResponse.json({ ok: false, error: "Provide a domain to scan." }, { status: 400 });
  }
  const parsed = parseTarget(targetRaw);
  if (!parsed) return NextResponse.json({ ok: false, error: "That doesn't look like a valid domain." }, { status: 400 });

  // Run the real analysis. The fetch is SSRF-guarded; recon is best-effort.
  let fetched;
  try {
    fetched = await safeFetch(parsed.url);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Could not reach the target." },
      { status: 422 }
    );
  }

  const headerReport = analyzeHeaders(fetched.headers);
  const cspHeader = fetched.headers["content-security-policy"];
  const csp = cspHeader ? analyzeCsp(cspHeader) : null;

  const [dns, subdomains] = await Promise.all([
    dnsRecords(parsed.host),
    discoverSubdomains(apexOf(parsed.host)),
  ]);

  const result = {
    target: parsed.host,
    finalUrl: fetched.finalUrl,
    status: fetched.status,
    grade: headerReport.grade,
    score: headerReport.score,
    present: headerReport.present,
    findings: headerReport.findings,
    csp: csp ? { directives: csp.directives } : null,
    dns,
    subdomains,
    scannedAt: new Date().toISOString(),
  };

  const scan = await db.scan.create({
    data: {
      userId: user.id,
      target: parsed.host,
      grade: result.grade,
      score: result.score,
      result: JSON.stringify(result),
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: scan.id, result });
}
