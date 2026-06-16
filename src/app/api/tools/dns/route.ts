import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimitAsync } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 10;

const VALID_TYPES = ["A","AAAA","CNAME","MX","NS","TXT","SOA","CAA","SRV","PTR"];
const DOMAIN_RE  = /^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$/i;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (await rateLimitAsync(`dns:${ip}`, 30, 60_000))
    return NextResponse.json({ ok: false, error: "Rate limit." }, { status: 429 });

  const body = await req.json().catch(() => ({})) as { domain?: string; type?: string };
  const domain = String(body.domain ?? "").trim().toLowerCase().replace(/^(https?:\/\/|www\.)/, "").replace(/\/$/, "");
  const type   = (String(body.type ?? "A").toUpperCase());

  if (!DOMAIN_RE.test(domain) || domain.length > 253)
    return NextResponse.json({ ok: false, error: "Invalid domain." }, { status: 400 });
  if (!VALID_TYPES.includes(type))
    return NextResponse.json({ ok: false, error: `Invalid record type. Use: ${VALID_TYPES.join(", ")}` }, { status: 400 });

  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`;
  const res = await fetch(url, {
    headers: { Accept: "application/dns-json" },
    signal: AbortSignal.timeout(8_000),
  }).catch(() => null);

  if (!res?.ok) return NextResponse.json({ ok: false, error: "DNS lookup failed." }, { status: 502 });

  const data = await res.json() as {
    Status: number;
    Answer?: { name: string; type: number; TTL: number; data: string }[];
    Authority?: { name: string; type: number; TTL: number; data: string }[];
  };

  const STATUS_CODES: Record<number, string> = { 0: "NOERROR", 1: "FORMERR", 2: "SERVFAIL", 3: "NXDOMAIN", 5: "REFUSED" };

  return NextResponse.json({
    ok: true,
    domain,
    type,
    status: STATUS_CODES[data.Status] ?? `RCODE ${data.Status}`,
    records: data.Answer ?? [],
    authority: data.Authority ?? [],
  });
}
