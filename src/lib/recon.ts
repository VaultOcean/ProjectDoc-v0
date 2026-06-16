import "server-only";
import dns from "node:dns/promises";

/** Real DNS records — each lookup is best-effort and never throws. */
export type DnsRecords = {
  a: string[];
  aaaa: string[];
  mx: string[];
  ns: string[];
  txt: string[];
  cname: string[];
};

async function safe<T>(p: Promise<T>, map: (v: T) => string[]): Promise<string[]> {
  try {
    return map(await p);
  } catch {
    return [];
  }
}

export async function dnsRecords(host: string): Promise<DnsRecords> {
  const [a, aaaa, mx, ns, txt, cname] = await Promise.all([
    safe(dns.resolve4(host), (v) => v),
    safe(dns.resolve6(host), (v) => v),
    safe(dns.resolveMx(host), (v) => v.sort((x, y) => x.priority - y.priority).map((m) => `${m.priority} ${m.exchange}`)),
    safe(dns.resolveNs(host), (v) => v),
    safe(dns.resolveTxt(host), (v) => v.map((t) => t.join(""))),
    safe(dns.resolveCname(host), (v) => v),
  ]);
  return { a, aaaa, mx, ns, txt, cname };
}

/**
 * Real subdomain discovery via Certificate Transparency logs (crt.sh).
 * crt.sh is a fixed, trusted public endpoint, so this isn't an SSRF surface.
 * Resilient: returns [] on timeout/error rather than failing the whole scan.
 */
export async function discoverSubdomains(domain: string, cap = 60): Promise<string[]> {
  try {
    const res = await fetch(`https://crt.sh/?q=${encodeURIComponent("%." + domain)}&output=json`, {
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "VaultOcean-Scanner/1.0" },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as { name_value: string }[];
    const set = new Set<string>();
    for (const r of rows) {
      for (const name of (r.name_value ?? "").split("\n")) {
        const n = name.trim().toLowerCase().replace(/^\*\./, "");
        if (n.endsWith(domain) && n !== domain && /^[a-z0-9.-]+$/.test(n)) set.add(n);
      }
    }
    return [...set].sort().slice(0, cap);
  } catch {
    return [];
  }
}
