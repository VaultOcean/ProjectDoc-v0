import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rateLimitAsync, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 20;

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

type CrtEntry = { name_value: string; logged_at: string };

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to use this tool." }, { status: 401 });

  const ip = clientIp(req);
  const limited = await rateLimitAsync(`subdomain:${ip}`, 10, 60_000);
  if (limited) return NextResponse.json({ ok: false, error: "Too many requests. Wait a minute." }, { status: 429 });

  let body: { domain?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const domain = String(body.domain ?? "").trim().toLowerCase().replace(/^(https?:\/\/|www\.)/, "");
  if (!domain || !DOMAIN_RE.test(domain) || domain.length > 253) {
    return NextResponse.json({ ok: false, error: "Invalid domain." }, { status: 400 });
  }

  // Block private TLDs / localhost
  if (/\.(local|internal|localhost|test|example)$/.test(domain)) {
    return NextResponse.json({ ok: false, error: "Private domains not allowed." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://crt.sh/?q=%.${encodeURIComponent(domain)}&output=json`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15_000) }
    );
    if (!res.ok) throw new Error(`crt.sh returned ${res.status}`);

    const raw = await res.json() as CrtEntry[];

    // Deduplicate and clean wildcard entries
    const seen = new Set<string>();
    const subdomains: { name: string; firstSeen: string }[] = [];

    for (const entry of raw) {
      const names = entry.name_value.split("\n").map((n) => n.trim().toLowerCase());
      for (const name of names) {
        const clean = name.replace(/^\*\./, "");
        if (!seen.has(clean) && clean.endsWith(`.${domain}`) || clean === domain) {
          seen.add(clean);
          subdomains.push({ name: clean, firstSeen: entry.logged_at });
        }
      }
    }

    // Sort by name, put domain itself first
    subdomains.sort((a, b) => {
      if (a.name === domain) return -1;
      if (b.name === domain) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      ok: true,
      domain,
      count: subdomains.length,
      subdomains: subdomains.slice(0, 200),
      source: "crt.sh (certificate transparency logs)",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lookup failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
