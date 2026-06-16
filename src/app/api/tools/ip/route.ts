import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimitAsync } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 10;

const IP4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const IP6_RE = /^[0-9a-f:]+$/i;

// Block private/loopback ranges from SSRF
const PRIVATE_RE = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.|169\.254\.|::1$|fc|fd)/i;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (await rateLimitAsync(`ip:${ip}`, 20, 60_000))
    return NextResponse.json({ ok: false, error: "Rate limit." }, { status: 429 });

  const body = await req.json().catch(() => ({})) as { ip?: string };
  const target = String(body.ip ?? "").trim();

  if (!IP4_RE.test(target) && !IP6_RE.test(target))
    return NextResponse.json({ ok: false, error: "Provide a valid IP address." }, { status: 400 });
  if (PRIVATE_RE.test(target))
    return NextResponse.json({ ok: false, error: "Private/loopback addresses are not allowed." }, { status: 400 });

  // ip-api.com — free, no key, 1000 req/min
  const [geo, shodan] = await Promise.allSettled([
    fetch(`http://ip-api.com/json/${encodeURIComponent(target)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query`, {
      signal: AbortSignal.timeout(8_000),
    }).then((r) => r.json()),
    // Shodan InternetDB — completely free, no key
    fetch(`https://internetdb.shodan.io/${encodeURIComponent(target)}`, {
      signal: AbortSignal.timeout(8_000),
    }).then((r) => r.json()),
  ]);

  const geoData = geo.status === "fulfilled" ? geo.value as Record<string, unknown> : null;
  const shodanData = shodan.status === "fulfilled" ? shodan.value as Record<string, unknown> : null;

  if (geoData?.status === "fail")
    return NextResponse.json({ ok: false, error: String(geoData.message ?? "Lookup failed") }, { status: 422 });

  return NextResponse.json({
    ok: true,
    ip: target,
    geo: geoData ?? null,
    shodan: shodanData ?? null,
  });
}
