import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export type GraphNode = {
  id: string;
  label: string;
  type: "doc" | "report" | "target";
  href: string;
  detail?: string;
};

export type GraphEdge = {
  source: string;
  target: string;
  kind: "fk" | "wikilink";
};

export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] };

// Extract [[wikilink]] patterns from HTML content
function extractWikilinks(html: string): string[] {
  const refs: string[] = [];
  const re = /\[\[([^\]]+)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    refs.push(m[1].trim().toLowerCase());
  }
  return refs;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [docs, reports, targets] = await Promise.all([
    db.doc.findMany({
      where: { userId: user.id },
      select: { id: true, title: true, slug: true, content: true, updatedAt: true },
    }),
    db.vulnReport.findMany({
      where: { userId: user.id },
      select: { id: true, title: true, severity: true, targetId: true },
    }),
    db.target.findMany({
      where: { userId: user.id },
      select: { id: true, domain: true, name: true },
    }),
  ]);

  const nodes: GraphNode[] = [
    ...docs.map((d) => ({
      id: `doc:${d.id}`,
      label: d.title || "Untitled",
      type: "doc" as const,
      href: `/workspace/${d.id}`,
    })),
    ...reports.map((r) => ({
      id: `report:${r.id}`,
      label: r.title,
      type: "report" as const,
      href: `/reports/${r.id}`,
      detail: r.severity,
    })),
    ...targets.map((t) => ({
      id: `target:${t.id}`,
      label: t.domain,
      type: "target" as const,
      href: `/targets/${t.id}`,
      detail: t.name || undefined,
    })),
  ];

  const edges: GraphEdge[] = [];

  // FK: report → target
  for (const r of reports) {
    if (r.targetId) {
      edges.push({ source: `report:${r.id}`, target: `target:${r.targetId}`, kind: "fk" });
    }
  }

  // Wikilinks: scan doc content for [[ref]] patterns
  const labelIndex = new Map<string, string>(); // normalised label → node id
  for (const n of nodes) {
    labelIndex.set(n.label.toLowerCase(), n.id);
  }
  // Also index target domains directly
  for (const t of targets) {
    labelIndex.set(t.domain.toLowerCase(), `target:${t.id}`);
  }

  for (const doc of docs) {
    const refs = extractWikilinks(doc.content);
    const srcId = `doc:${doc.id}`;
    const seen = new Set<string>();
    for (const ref of refs) {
      const targetId = labelIndex.get(ref);
      if (targetId && targetId !== srcId && !seen.has(targetId)) {
        seen.add(targetId);
        edges.push({ source: srcId, target: targetId, kind: "wikilink" });
      }
    }
  }

  return NextResponse.json({ nodes, edges } satisfies GraphData);
}
