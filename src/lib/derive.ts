import type { ScanRow } from "@/lib/queries";

/** Pure aggregation of real scan rows into the Assets and Vulnerabilities views. */

export type Asset = {
  host: string;
  kind: "scanned host" | "subdomain";
  ips: string[];
  grade: string | null;
  sources: string[]; // scan targets that revealed this asset
  lastSeen: string;
};

export function deriveAssets(scans: ScanRow[]): { assets: Asset[]; hosts: number; subdomains: number } {
  const map = new Map<string, Asset>();
  // Oldest → newest so lastSeen ends up newest.
  for (const s of [...scans].reverse()) {
    const touch = (host: string, kind: Asset["kind"], ips: string[], grade: string | null) => {
      const ex = map.get(host);
      if (ex) {
        ex.lastSeen = s.createdAt;
        if (grade) ex.grade = grade;
        for (const ip of ips) if (!ex.ips.includes(ip)) ex.ips.push(ip);
        if (!ex.sources.includes(s.target)) ex.sources.push(s.target);
        if (kind === "scanned host") ex.kind = kind;
      } else {
        map.set(host, { host, kind, ips: [...ips], grade, sources: [s.target], lastSeen: s.createdAt });
      }
    };
    touch(s.target, "scanned host", [...s.dns.a, ...s.dns.aaaa], s.grade);
    for (const sub of s.subdomains) if (sub !== s.target) touch(sub, "subdomain", [], null);
  }
  const assets = [...map.values()].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "scanned host" ? -1 : 1;
    return a.host.localeCompare(b.host);
  });
  return {
    assets,
    hosts: assets.filter((a) => a.kind === "scanned host").length,
    subdomains: assets.filter((a) => a.kind === "subdomain").length,
  };
}

export type Vuln = {
  key: string;
  target: string;
  title: string;
  severity: string;
  detail: string;
  fix?: string;
  at: string;
};

const SEV_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function deriveVulns(scans: ScanRow[]): {
  vulns: Vuln[];
  counts: { critical: number; high: number; medium: number; low: number };
} {
  const map = new Map<string, Vuln>();
  // Newest first: first occurrence per (target+finding) wins.
  for (const s of scans) {
    for (const f of s.findings) {
      if (f.severity === "good" || f.severity === "info") continue;
      const key = `${s.target}::${f.id}`;
      if (!map.has(key)) {
        map.set(key, { key, target: s.target, title: f.title, severity: f.severity, detail: f.detail, fix: f.fix, at: s.createdAt });
      }
    }
  }
  const vulns = [...map.values()].sort((a, b) => (SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9));
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const v of vulns) if (v.severity in counts) counts[v.severity as keyof typeof counts]++;
  return { vulns, counts };
}
