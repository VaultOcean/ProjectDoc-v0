import "server-only";
import { db } from "@/lib/db";

export type ToolView = {
  slug: string;
  name: string;
  summary: string;
  detail: string;
  language: string;
  repo: string;
  status: string;
  tags: string[];
};

function toolView(t: {
  slug: string; name: string; summary: string; detail: string;
  language: string; repo: string; status: string; tags: string;
}): ToolView {
  return { ...t, tags: t.tags.split(",").map((s) => s.trim()).filter(Boolean) };
}

export async function getTools(): Promise<ToolView[]> {
  const rows = await db.tool.findMany({ orderBy: { sort: "asc" } });
  return rows.map(toolView);
}

export async function getToolBySlug(slug: string): Promise<ToolView | null> {
  const t = await db.tool.findUnique({ where: { slug } });
  return t ? toolView(t) : null;
}

export function getWriteups() {
  return db.writeup.findMany({ orderBy: { date: "desc" } });
}

export function getWriteupBySlug(slug: string) {
  return db.writeup.findUnique({ where: { slug } });
}

const DIFF_ORDER = ["easy", "medium", "hard", "insane"];

function parseJson<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export type ChallengeView = {
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  fathoms: number;
  prompt: string;
  description: string;
  hints: string[];
  files: { name: string; url: string }[];
  kind: string;
  active: boolean;
  solves: number;
  solved: boolean;
};

export async function getChallengesWithState(userId: string | null): Promise<ChallengeView[]> {
  const [challenges, solveCounts, mySolves] = await Promise.all([
    db.challenge.findMany(),
    db.solve.groupBy({ by: ["challengeId"], _count: { _all: true } }),
    userId ? db.solve.findMany({ where: { userId }, select: { challengeId: true } }) : Promise.resolve([]),
  ]);

  const countMap = new Map(solveCounts.map((s) => [s.challengeId, s._count._all]));
  const mine = new Set(mySolves.map((s) => s.challengeId));

  return challenges
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      category: c.category,
      difficulty: c.difficulty,
      fathoms: c.fathoms,
      prompt: c.prompt,
      description: c.description,
      hints: parseJson<string[]>(c.hints, []),
      files: parseJson<{ name: string; url: string }[]>(c.files, []),
      kind: c.kind,
      active: c.active,
      solves: countMap.get(c.id) ?? 0,
      solved: mine.has(c.id),
    }))
    .sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return DIFF_ORDER.indexOf(a.difficulty) - DIFF_ORDER.indexOf(b.difficulty);
    });
}

/** Challenges grouped by category, for the board. */
export async function getChallengesByCategory(userId: string | null) {
  const all = await getChallengesWithState(userId);
  const groups = new Map<string, ChallengeView[]>();
  for (const c of all) {
    if (!groups.has(c.category)) groups.set(c.category, []);
    groups.get(c.category)!.push(c);
  }
  return [...groups.entries()].map(([category, items]) => ({ category, items }));
}

export async function getChallengeWithState(slug: string, userId: string | null): Promise<ChallengeView | null> {
  const all = await getChallengesWithState(userId);
  return all.find((c) => c.slug === slug) ?? null;
}

export async function getLeaderboard(limit = 25) {
  const users = await db.user.findMany({
    orderBy: [{ fathoms: "desc" }, { createdAt: "asc" }],
    take: limit,
    select: { handle: true, displayName: true, fathoms: true, streakDays: true, _count: { select: { solves: true } } },
  });
  return users.map((u, i) => ({
    rank: i + 1,
    handle: u.handle,
    displayName: u.displayName,
    fathoms: u.fathoms,
    streakDays: u.streakDays,
    solves: u._count.solves,
  }));
}

/** 52 weeks × 7 days of activity intensity (0..4), oldest-first, column-major. */
export async function getActivityGrid(userId: string): Promise<number[]> {
  const days = 52 * 7;
  const since = new Date(Date.now() - (days - 1) * 86_400_000);
  const rows = await db.activity.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const counts = new Map<number, number>();
  for (const r of rows) {
    const key = Date.UTC(
      r.createdAt.getUTCFullYear(),
      r.createdAt.getUTCMonth(),
      r.createdAt.getUTCDate()
    );
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const grid: number[] = [];
  const today = new Date();
  const todayKey = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  for (let i = days - 1; i >= 0; i--) {
    const key = todayKey - i * 86_400_000;
    const n = counts.get(key) ?? 0;
    grid.push(n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : 4);
  }
  return grid;
}

export async function getProfileByHandle(handle: string) {
  const user = await db.user.findUnique({ where: { handle } });
  if (!user) return null;

  const [solveCount, readCount, publishCount, contributeCount, grid] = await Promise.all([
    db.solve.count({ where: { userId: user.id } }),
    db.activity.count({ where: { userId: user.id, kind: "read" } }),
    db.activity.count({ where: { userId: user.id, kind: "publish" } }),
    db.activity.count({ where: { userId: user.id, kind: "contribute" } }),
    getActivityGrid(user.id),
  ]);

  return {
    handle: user.handle,
    displayName: user.displayName,
    bio: user.bio,
    fathoms: user.fathoms,
    streakDays: user.streakDays,
    joined: user.createdAt.toISOString().slice(0, 10),
    contributions: grid,
    stats: {
      challengesSolved: solveCount,
      writeupsRead: readCount,
      writeupsPublished: publishCount,
      toolPrsMerged: contributeCount,
    },
  };
}

export type ScanResult = {
  target: string;
  finalUrl: string;
  status: number;
  grade: string;
  score: number;
  present: { name: string; value: string }[];
  findings: { id: string; title: string; severity: string; detail: string; fix?: string }[];
  csp: { directives: { name: string; values: string[] }[] } | null;
  dns: { a: string[]; aaaa: string[]; mx: string[]; ns: string[]; txt: string[]; cname: string[] };
  subdomains: string[];
  scannedAt: string;
};

export async function getLatestScan(userId: string): Promise<ScanResult | null> {
  const scan = await db.scan.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  if (!scan) return null;
  try {
    return JSON.parse(scan.result) as ScanResult;
  } catch {
    return null;
  }
}

export type ScanRow = ScanResult & { id: string; createdAt: string };

export async function getAllScans(userId: string, limit = 100): Promise<ScanRow[]> {
  const rows = await db.scan.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit });
  const out: ScanRow[] = [];
  for (const r of rows) {
    try {
      out.push({ ...(JSON.parse(r.result) as ScanResult), id: r.id, createdAt: r.createdAt.toISOString() });
    } catch {
      /* skip corrupt */
    }
  }
  return out;
}

export async function getScanReport(userId: string, id: string): Promise<ScanRow | null> {
  const r = await db.scan.findFirst({ where: { id, userId } });
  if (!r) return null;
  try {
    return { ...(JSON.parse(r.result) as ScanResult), id: r.id, createdAt: r.createdAt.toISOString() };
  } catch {
    return null;
  }
}

export async function getRecentScans(userId: string, limit = 8) {
  const scans = await db.scan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, target: true, grade: true, score: true, createdAt: true },
  });
  return scans.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }));
}

/* ---------- Docs (Notion-style notes + Medium-style blog) ---------- */

export function slugify(title: string): string {
  const base = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return (base || "untitled") + "-" + Math.random().toString(36).slice(2, 7);
}

export function readMinutes(content: string): number {
  const text = content.trimStart().startsWith("<")
    ? content.replace(/<[^>]*>/g, " ")
    : content;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function getUserDocs(userId: string) {
  return db.doc.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, summary: true, slug: true, visibility: true, updatedAt: true },
  });
}

export function getDocForEdit(userId: string, id: string) {
  return db.doc.findFirst({ where: { id, userId } });
}

export async function getPublicBlog(handle: string) {
  const user = await db.user.findUnique({ where: { handle } });
  if (!user) return null;
  const docs = await db.doc.findMany({
    where: { userId: user.id, visibility: "public" },
    orderBy: { updatedAt: "desc" },
    select: { title: true, summary: true, slug: true, readMinutes: true, updatedAt: true },
  });
  return { handle: user.handle, displayName: user.displayName, bio: user.bio, docs };
}

export async function getPublicDoc(handle: string, slug: string) {
  const user = await db.user.findUnique({ where: { handle }, select: { id: true, handle: true, displayName: true } });
  if (!user) return null;
  const doc = await db.doc.findFirst({ where: { userId: user.id, slug, visibility: "public" } });
  if (!doc) return null;
  return { doc, author: { handle: user.handle, displayName: user.displayName } };
}

export async function getProfileRecentSolves(handle: string, limit = 6) {
  const user = await db.user.findUnique({ where: { handle }, select: { id: true } });
  if (!user) return [];
  const solves = await db.solve.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      createdAt: true,
      challenge: {
        select: { slug: true, title: true, difficulty: true, category: true, fathoms: true },
      },
    },
  });
  return solves.map((s) => ({
    slug: s.challenge.slug,
    title: s.challenge.title,
    difficulty: s.challenge.difficulty,
    category: s.challenge.category,
    fathoms: s.challenge.fathoms,
    solvedAt: s.createdAt.toISOString(),
  }));
}

export async function getRelatedWriteups(category: string, excludeSlug: string, limit = 3) {
  return db.writeup.findMany({
    where: { category, NOT: { slug: excludeSlug } },
    orderBy: { date: "desc" },
    take: limit,
    select: { slug: true, title: true, severity: true, category: true, readMinutes: true },
  });
}

export async function getSiteStats() {
  const [tools, writeups, solves] = await Promise.all([
    db.tool.count(),
    db.writeup.count(),
    db.solve.count(),
  ]);
  return { tools, writeups, solves };
}
