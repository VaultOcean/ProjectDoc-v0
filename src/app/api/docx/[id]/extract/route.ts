import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/* POST /api/docx/[id]/extract
   Proxies to tenant's Eagle server exactly like AssetxOcean does.
   After extraction, saves rawText + suggested fields to DB.
*/
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const session = await db.docxSession.findUnique({ where: { id } });
  if (!session || session.userId !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  /* Check tenant connector */
  const config = await db.tenantConfig.findUnique({ where: { userId: user.id } });
  if (!config?.serverUrl)
    return NextResponse.json({ ok: false, code: "NO_CONNECTOR", error: "No Eagle server configured." }, { status: 503 });
  if (config.status !== "active")
    return NextResponse.json({ ok: false, code: "NOT_ACTIVE", error: "Eagle connector is not yet active." }, { status: 403 });

  const body = await req.json() as { content: string; mimeType: string };

  /* Mark session as extracting */
  await db.docxSession.update({ where: { id }, data: { status: "extracting" } });

  /* Forward to Eagle */
  let eagleData: { columns?: string[]; records?: Record<string, string>[]; raw_text?: string };
  try {
    const resp = await fetch(`${config.serverUrl}/extract`, {
      method: "POST",
      headers: {
        "Content-Type":          "application/json",
        "Authorization":         `Bearer ${config.apiKey}`,
        "X-VaultOcean-Connector": "1",
        "X-VaultOcean-Mode":     "docx",
      },
      body: JSON.stringify({
        content:   body.content,
        mime_type: body.mimeType,
        mode:      "docx",
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "Eagle server error");
      await db.docxSession.update({ where: { id }, data: { status: "error", errorMsg: txt } });
      return NextResponse.json({ ok: false, error: txt }, { status: 502 });
    }

    eagleData = await resp.json() as typeof eagleData;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Connection to Eagle server timed out.";
    await db.docxSession.update({ where: { id }, data: { status: "error", errorMsg: msg } });
    return NextResponse.json({ ok: false, error: msg }, { status: 504 });
  }

  /* Derive rawText: use eagle's raw_text if provided, else join all values */
  const columns = eagleData.columns ?? [];
  const records = eagleData.records ?? [];
  const rawText = eagleData.raw_text
    || (body.mimeType.startsWith("text/") || body.mimeType.includes("json") || body.mimeType.includes("xml")
      ? body.content
      : records.map((r) => Object.values(r).join(" ")).join("\n"));

  const wordCount = rawText.split(/\s+/).filter(Boolean).length;

  /* Delete existing eagle-suggested fields to avoid duplicates on re-extract */
  await db.docxField.deleteMany({ where: { sessionId: id, source: "eagle" } });

  /* Build suggested fields from Eagle columns/records */
  const suggestedFields: { name: string; value: string; source: string; confidence: number }[] = [];

  if (columns.length > 0 && records.length > 0) {
    /* Eagle returned a structured table — take first record as field values */
    const firstRecord = records[0]!;
    columns.forEach((col, idx) => {
      suggestedFields.push({
        name:       col,
        value:      firstRecord[col] ?? "",
        source:     "eagle",
        confidence: 0.9,
      });
      void idx;
    });
  } else if (records.length > 0) {
    /* Eagle returned key-value pairs directly */
    records.forEach((r) => {
      const name = r["name"] || r["field"] || r["key"] || "";
      const value = r["value"] || r["val"] || "";
      if (name) suggestedFields.push({ name, value, source: "eagle", confidence: 0.85 });
    });
  }

  /* Persist suggested fields */
  if (suggestedFields.length > 0) {
    await db.docxField.createMany({
      data: suggestedFields.map((f, i) => ({
        sessionId:  id,
        name:       f.name,
        value:      f.value,
        source:     "eagle",
        confidence: f.confidence,
        position:   i,
      })),
    });
  }

  /* Update session */
  await db.docxSession.update({
    where: { id },
    data:  { status: "ready", rawText, wordCount, errorMsg: "" },
  });

  const fields = await db.docxField.findMany({
    where: { sessionId: id },
    orderBy: { position: "asc" },
  });

  return NextResponse.json({ ok: true, rawText, fields });
}
