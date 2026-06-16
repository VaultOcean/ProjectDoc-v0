import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600; // Cache 1 hour

type NvdCve = {
  cve: {
    id: string;
    published: string;
    descriptions: { lang: string; value: string }[];
    metrics?: {
      cvssMetricV31?: { cvssData: { baseScore: number; baseSeverity: string } }[];
      cvssMetricV2?: { cvssData: { baseScore: number } }[];
    };
    references: { url: string }[];
  };
};

export async function GET() {
  try {
    const res = await fetch(
      "https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=10&startIndex=0&keywordSearch=web+api+authentication+injection+xss+csrf+ssrf+rce&noRejected",
      {
        headers: { "User-Agent": "VaultOcean/1.0 (security research community)" },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) throw new Error(`NVD API ${res.status}`);
    const data = await res.json() as { vulnerabilities?: NvdCve[] };

    const cves = (data.vulnerabilities ?? []).slice(0, 8).map((v) => {
      const c = v.cve;
      const desc = c.descriptions.find((d) => d.lang === "en")?.value ?? "";
      const score =
        c.metrics?.cvssMetricV31?.[0]?.cvssData.baseScore ??
        c.metrics?.cvssMetricV2?.[0]?.cvssData.baseScore ??
        null;
      const severity =
        c.metrics?.cvssMetricV31?.[0]?.cvssData.baseSeverity?.toLowerCase() ?? null;

      return {
        id: c.id,
        published: c.published,
        summary: desc.length > 180 ? desc.slice(0, 177) + "…" : desc,
        score,
        severity,
        url: `https://nvd.nist.gov/vuln/detail/${c.id}`,
      };
    });

    return NextResponse.json({ ok: true, cves });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed to fetch CVEs" },
      { status: 502 }
    );
  }
}
