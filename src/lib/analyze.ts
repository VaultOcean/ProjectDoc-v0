/**
 * Real security-header + CSP analysis. Pure functions over the actual HTTP
 * response headers we fetched — no mock data. Produces a graded report with
 * concrete, copy-pasteable fixes.
 */

export type Severity = "critical" | "high" | "medium" | "low" | "good" | "info";

export type Finding = {
  id: string;
  title: string;
  severity: Severity;
  detail: string;
  fix?: string;
};

export type HeaderReport = {
  score: number;
  grade: string;
  present: { name: string; value: string }[];
  findings: Finding[];
};

const WEIGHT: Record<Severity, number> = { critical: 30, high: 18, medium: 10, low: 4, info: 0, good: 0 };

function gradeFor(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

export function analyzeHeaders(headers: Record<string, string>): HeaderReport {
  const findings: Finding[] = [];
  const get = (k: string) => headers[k.toLowerCase()];

  // HSTS
  const hsts = get("strict-transport-security");
  if (!hsts) {
    findings.push({ id: "hsts", title: "No HSTS", severity: "high", detail: "Strict-Transport-Security is missing — connections can be downgraded to HTTP (SSL stripping).", fix: "Strict-Transport-Security: max-age=63072000; includeSubDomains; preload" });
  } else {
    const max = parseInt(/max-age=(\d+)/.exec(hsts)?.[1] ?? "0", 10);
    if (max < 15552000) findings.push({ id: "hsts-short", title: "HSTS max-age is short", severity: "medium", detail: `max-age is ${max}s; under the recommended 6 months.`, fix: "Raise max-age to at least 15552000 and add includeSubDomains." });
    else if (!/includesubdomains/i.test(hsts)) findings.push({ id: "hsts-sub", title: "HSTS missing includeSubDomains", severity: "low", detail: "Subdomains are not covered by HSTS.", fix: "Append; includeSubDomains" });
    else findings.push({ id: "hsts-good", title: "Strong HSTS", severity: "good", detail: "HSTS is present with a long max-age." });
  }

  // CSP
  const csp = get("content-security-policy");
  if (!csp) {
    findings.push({ id: "csp", title: "No Content-Security-Policy", severity: "high", detail: "Without a CSP, an injected script runs with full privileges (XSS).", fix: "Add a strict CSP; start with default-src 'self'; object-src 'none'; frame-ancestors 'none'." });
  } else {
    findings.push(...analyzeCsp(csp).findings);
  }

  // Clickjacking
  if (!get("x-frame-options") && !/frame-ancestors/i.test(csp ?? "")) {
    findings.push({ id: "clickjack", title: "Clickjacking possible", severity: "medium", detail: "Neither X-Frame-Options nor CSP frame-ancestors is set; the page can be framed.", fix: "X-Frame-Options: DENY  (or CSP frame-ancestors 'none')" });
  }

  // nosniff
  if (!/nosniff/i.test(get("x-content-type-options") ?? "")) {
    findings.push({ id: "nosniff", title: "MIME sniffing not disabled", severity: "medium", detail: "X-Content-Type-Options: nosniff is missing; browsers may MIME-sniff responses.", fix: "X-Content-Type-Options: nosniff" });
  }

  // Referrer-Policy
  if (!get("referrer-policy")) findings.push({ id: "ref", title: "No Referrer-Policy", severity: "low", detail: "Referrer-Policy is missing; full URLs may leak to third parties.", fix: "Referrer-Policy: strict-origin-when-cross-origin" });

  // Permissions-Policy
  if (!get("permissions-policy")) findings.push({ id: "pp", title: "No Permissions-Policy", severity: "low", detail: "Powerful features (camera, mic, geolocation) are not restricted.", fix: "Permissions-Policy: camera=(), microphone=(), geolocation=()" });

  // COOP
  if (!get("cross-origin-opener-policy")) findings.push({ id: "coop", title: "No Cross-Origin-Opener-Policy", severity: "low", detail: "COOP is missing; cross-origin window references aren't isolated.", fix: "Cross-Origin-Opener-Policy: same-origin" });

  // Info disclosure
  const server = get("server");
  const xpb = get("x-powered-by");
  if (xpb) findings.push({ id: "xpb", title: "Technology disclosed via X-Powered-By", severity: "low", detail: `X-Powered-By reveals "${xpb}", helping attackers fingerprint the stack.`, fix: "Remove the X-Powered-By header." });
  if (server && /\d/.test(server)) findings.push({ id: "server", title: "Server version disclosed", severity: "low", detail: `Server header reveals "${server}".`, fix: "Strip version info from the Server header." });

  const present = [
    "strict-transport-security", "content-security-policy", "x-frame-options",
    "x-content-type-options", "referrer-policy", "permissions-policy",
    "cross-origin-opener-policy", "cross-origin-resource-policy",
  ].filter((h) => get(h)).map((h) => ({ name: h, value: get(h)! }));

  let score = 100;
  for (const f of findings) score -= WEIGHT[f.severity];
  score = Math.max(0, Math.min(100, score));

  // Sort: worst first, good last.
  const order: Severity[] = ["critical", "high", "medium", "low", "info", "good"];
  findings.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));

  return { score, grade: gradeFor(score), present, findings };
}

export type CspReport = { directives: { name: string; values: string[] }[]; findings: Finding[] };

export function analyzeCsp(csp: string): CspReport {
  const directives = csp
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const [name, ...values] = d.split(/\s+/);
      return { name: name.toLowerCase(), values };
    });

  const find = (n: string) => directives.find((d) => d.name === n);
  const scriptSrc = find("script-src") ?? find("default-src");
  const findings: Finding[] = [];

  if (scriptSrc?.values.includes("'unsafe-inline'"))
    findings.push({ id: "csp-inline", title: "CSP allows 'unsafe-inline' scripts", severity: "high", detail: "Inline scripts are permitted, which defeats most of CSP's XSS protection.", fix: "Remove 'unsafe-inline'; use nonces or hashes." });
  if (scriptSrc?.values.includes("'unsafe-eval'"))
    findings.push({ id: "csp-eval", title: "CSP allows 'unsafe-eval'", severity: "medium", detail: "eval() and similar are permitted, expanding the XSS surface.", fix: "Remove 'unsafe-eval'." });
  if (scriptSrc?.values.includes("*"))
    findings.push({ id: "csp-wild", title: "CSP script source is wildcarded", severity: "high", detail: "A '*' source lets scripts load from anywhere.", fix: "Replace '*' with an explicit allow-list." });
  if (!find("object-src"))
    findings.push({ id: "csp-object", title: "CSP missing object-src", severity: "low", detail: "Plugins/embeds aren't restricted.", fix: "Add object-src 'none'." });
  if (!find("frame-ancestors"))
    findings.push({ id: "csp-fa", title: "CSP missing frame-ancestors", severity: "low", detail: "Framing isn't controlled by CSP.", fix: "Add frame-ancestors 'none'." });
  if (!find("base-uri"))
    findings.push({ id: "csp-base", title: "CSP missing base-uri", severity: "low", detail: "A <base> injection could redirect relative URLs.", fix: "Add base-uri 'self'." });
  if (findings.length === 0)
    findings.push({ id: "csp-good", title: "CSP looks solid", severity: "good", detail: "No obvious CSP weaknesses found." });

  return { directives, findings };
}
