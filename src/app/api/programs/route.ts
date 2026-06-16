import { NextResponse } from "next/server";
import { clientIp, rateLimitAsync } from "@/lib/ratelimit";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600; // cache 1 hour

type Program = {
  id: string;
  name: string;
  handle: string;
  platform: "HackerOne" | "Bugcrowd" | "Intigriti";
  url: string;
  minBounty: number | null;
  maxBounty: number | null;
  managed: boolean;
  launched: string | null;
};

let CACHE: Program[] | null = null;
let CACHE_AT = 0;
const CACHE_TTL = 3600_000;

async function fetchBugcrowd(): Promise<Program[]> {
  try {
    const res = await fetch("https://bugcrowd.com/programs.json", {
      headers: { Accept: "application/json", "User-Agent": "VaultOcean/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { programs?: { name?: string; program_url?: string; license?: string }[] };
    return (data.programs ?? []).slice(0, 100).map((p, i) => ({
      id: `bc-${i}`,
      name: p.name ?? "Unknown",
      handle: (p.program_url ?? "").replace(/.*\//, ""),
      platform: "Bugcrowd",
      url: p.program_url ? `https://bugcrowd.com${p.program_url}` : "https://bugcrowd.com",
      minBounty: null,
      maxBounty: null,
      managed: p.license === "pro",
      launched: null,
    }));
  } catch {
    return [];
  }
}

async function fetchHackerOne(): Promise<Program[]> {
  try {
    const res = await fetch(
      "https://hackerone.com/programs/search?query=type:hackerone&sort=published_at:descending&page=1",
      {
        headers: { Accept: "application/json", "User-Agent": "VaultOcean/1.0" },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) return [];
    const data = await res.json() as {
      results?: {
        name?: string; handle?: string; url?: string;
        min_bounty_table?: string; max_bounty_table?: string;
        launched_at?: string; managed_program?: boolean;
      }[]
    };
    return (data.results ?? []).slice(0, 100).map((p, i) => ({
      id: `h1-${i}`,
      name: p.name ?? "Unknown",
      handle: p.handle ?? "",
      platform: "HackerOne",
      url: p.url ? `https://hackerone.com${p.url}` : "https://hackerone.com",
      minBounty: p.min_bounty_table ? parseFloat(p.min_bounty_table) : null,
      maxBounty: p.max_bounty_table ? parseFloat(p.max_bounty_table) : null,
      managed: p.managed_program ?? false,
      launched: p.launched_at ?? null,
    }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  if (await rateLimitAsync(`programs:${ip}`, 20, 60_000)) {
    return NextResponse.json({ ok: false, error: "Rate limit." }, { status: 429 });
  }

  const now = Date.now();
  if (CACHE && now - CACHE_AT < CACHE_TTL) {
    return NextResponse.json({ ok: true, programs: CACHE, cached: true });
  }

  const [h1, bc] = await Promise.allSettled([fetchHackerOne(), fetchBugcrowd()]);
  const programs = [
    ...(h1.status === "fulfilled" ? h1.value : []),
    ...(bc.status === "fulfilled" ? bc.value : []),
  ];

  CACHE = programs;
  CACHE_AT = now;

  return NextResponse.json({ ok: true, programs, cached: false });
}
