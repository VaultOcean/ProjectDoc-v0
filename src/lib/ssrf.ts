import "server-only";
import dns from "node:dns/promises";
import net from "node:net";

/**
 * SSRF-hardened outbound fetch for the scanner.
 *
 * A scanner fetches URLs on the user's behalf, which is the textbook SSRF risk:
 * a malicious target could point at internal services or cloud metadata
 * (169.254.169.254). We defend by:
 *   - allowing only http/https
 *   - resolving every hostname and rejecting private/reserved/loopback/
 *     link-local/CGNAT/metadata IPs (v4 and v6, incl. mapped/NAT64)
 *   - following redirects manually and re-validating each hop
 *   - hard timeout + response size cap
 *
 * Residual risk: DNS rebinding between our resolve and fetch's own resolve
 * (TOCTOU). Acceptable for a low-rate authenticated scanner; a stricter build
 * would pin the connection to the validated IP.
 */

const MAX_REDIRECTS = 4;
const TIMEOUT_MS = 9000;
const MAX_BYTES = 512 * 1024; // we only need headers + a little HTML

function ipv4Blocked(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  if (a === 0 || a === 10 || a === 127) return true; // this-net, private, loopback
  if (a === 169 && b === 254) return true; // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 + test
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function ipv6Blocked(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true; // loopback / unspecified
  // IPv4-mapped (::ffff:1.2.3.4) and NAT64 (64:ff9b::1.2.3.4) → check embedded v4
  const mapped = lower.match(/(?:::ffff:|64:ff9b::)(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipv4Blocked(mapped[1]);
  const head = lower.split(":")[0];
  const h = parseInt(head || "0", 16);
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb"))
    return true; // fe80::/10 link-local
  if ((h & 0xfe00) === 0xfc00) return true; // fc00::/7 ULA
  if (lower.startsWith("ff")) return true; // multicast
  return false;
}

export function isBlockedIp(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) return ipv4Blocked(ip);
  if (v === 6) return ipv6Blocked(ip);
  return true; // not a literal IP → block (we only pass resolved IPs here)
}

async function assertHostAllowed(hostname: string): Promise<void> {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal"))
    throw new Error("Target is not allowed.");
  // If the host is already an IP literal, validate directly.
  if (net.isIP(host)) {
    if (isBlockedIp(host)) throw new Error("Target resolves to a private address.");
    return;
  }
  let records: { address: string }[];
  try {
    records = await dns.lookup(host, { all: true });
  } catch {
    throw new Error("Could not resolve the target hostname.");
  }
  if (records.length === 0) throw new Error("Target did not resolve.");
  for (const r of records) {
    if (isBlockedIp(r.address)) throw new Error("Target resolves to a private/reserved address.");
  }
}

export type SafeResponse = {
  status: number;
  headers: Record<string, string>;
  finalUrl: string;
  body: string;
};

export async function safeFetch(rawUrl: string): Promise<SafeResponse> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only http/https is allowed.");

  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertHostAllowed(current.hostname);

    const res = await fetch(current.toString(), {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "VaultOcean-Scanner/1.0 (+https://vaultocean.com)", Accept: "text/html,*/*" },
    });

    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      const next = new URL(res.headers.get("location")!, current);
      if (next.protocol !== "http:" && next.protocol !== "https:") throw new Error("Redirect to non-http scheme blocked.");
      current = next;
      if (hop === MAX_REDIRECTS) throw new Error("Too many redirects.");
      continue;
    }

    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));

    // Read a capped slice of the body.
    let body = "";
    const reader = res.body?.getReader();
    if (reader) {
      const dec = new TextDecoder();
      let total = 0;
      while (total < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        body += dec.decode(value, { stream: true });
      }
      await reader.cancel().catch(() => {});
    }

    return { status: res.status, headers, finalUrl: current.toString(), body };
  }
  throw new Error("Too many redirects.");
}
