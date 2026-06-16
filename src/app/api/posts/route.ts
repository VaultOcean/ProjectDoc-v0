import { NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const ALLOWED_TAGS = [
  "h1","h2","h3","p","strong","em","u","s","code","pre","blockquote",
  "ul","ol","li","a","img","hr","br","span","mark","sup","sub",
  "table","thead","tbody","tr","th","td",
];

function sanitize(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href","target","rel"],
      img: ["src","alt","width","height"],
      code: ["class"],
      pre: ["class"],
      span: ["style","class"],
      mark: ["style"],
    },
    allowedStyles: {
      span: { "color": [/.*/], "background-color": [/.*/] },
      mark: { "background-color": [/.*/] },
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: "noopener noreferrer", target: "_blank" },
      }),
    },
  });
}

export const runtime = "nodejs";

function slug(title: string, id: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) +
    "-" +
    id.slice(-6)
  );
}

function readMins(html: string) {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// GET /api/posts — community feed (published only)
export async function GET(req: NextRequest) {
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = 20;

  const posts = await db.post.findMany({
    where: { status: "published" },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      tags: true,
      readMinutes: true,
      createdAt: true,
      author: { select: { handle: true, displayName: true } },
    },
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({
    posts: items.map((p) => ({
      ...p,
      tags: (() => { try { return JSON.parse(p.tags); } catch { return []; } })(),
    })),
    nextCursor,
  });
}

// POST /api/posts — create or update draft
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    id?: string;
    title: string;
    summary?: string;
    body?: string;
    tags?: string[];
    action?: "draft" | "publish";
  };

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const action = body.action ?? "draft";
  const tagsJson = JSON.stringify(body.tags ?? []);
  const mins = readMins(body.body ?? "");

  // Update existing
  if (body.id) {
    const existing = await db.post.findFirst({
      where: { id: body.id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.post.update({
      where: { id: body.id },
      data: {
        title: body.title.trim(),
        summary: body.summary?.trim() ?? "",
        body: sanitize(body.body ?? ""),
        tags: tagsJson,
        readMinutes: mins,
        status: action === "publish" ? "published" : existing.status,
      },
    });

    if (action === "publish" && existing.status !== "published") {
      // Award fathoms on first publish
      await db.user.update({
        where: { id: user.id },
        data: { fathoms: { increment: 50 } },
      }).catch(() => null);
    }

    return NextResponse.json({ ok: true, slug: updated.slug, id: updated.id });
  }

  // Create new
  const id = `${Date.now()}`;
  const postSlug = slug(body.title, id);

  const post = await db.post.create({
    data: {
      userId: user.id,
      slug: postSlug,
      title: body.title.trim(),
      summary: body.summary?.trim() ?? "",
      body: sanitize(body.body ?? ""),
      tags: tagsJson,
      readMinutes: mins,
      status: action === "publish" ? "published" : "draft",
    },
  });

  if (action === "publish") {
    await db.user.update({
      where: { id: user.id },
      data: { fathoms: { increment: 50 } },
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, slug: post.slug, id: post.id });
}
