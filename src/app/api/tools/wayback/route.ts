import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimitAsync } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 15;

const DOMAIN_RE = /^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$/i;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (await rateLimitAsync(`wayback:${ip}`, 10, 60_000))
    return NextResponse.json({ ok: false, error: "Rate limit." }, { status: 429 });

  const body = await req.json().catch(() => ({})) as { domain?: string };
  const domain = String(body.domain ?? "").trim().toLowerCase().replace(/^(https?:\/\/|www\.)/, "").replace(/\/$/, "");

  if (!DOMAIN_RE.test(domain) || domain.length > 253)
    return NextResponse.json({ ok: false, error: "Invalid domain." }, { status: 400 });

  const url = `https://web.archive.org/cdx/search/cdx?url=*.${domain}/*&output=json&fl=original,statuscode,timestamp&collapse=urlkey&limit=200&filter=statuscode:200`;

  const res = await fetch(url, { signal: AbortSignal.timeout(14_000) }).catch(() => null);
  if (!res?.ok) return NextResponse.json({ ok: false, error: "Wayback Machine unavailable." }, { status: 502 });

  const rows = await res.json() as string[][];
  // First row is headers
  const [, ...data] = rows;

  const urls = data.map(([original, statuscode, timestamp]) => ({
    url: original,
    status: statuscode,
    date: timestamp ? `${timestamp.slice(0,4)}-${timestamp.slice(4,6)}-${timestamp.slice(6,8)}` : null,
  }));

  return NextResponse.json({ ok: true, domain, count: urls.length, urls: urls.slice(0, 200) });
}
