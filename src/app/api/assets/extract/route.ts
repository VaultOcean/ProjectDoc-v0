import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { db } from "@/lib/db";

/* ── POST /api/assets/extract ──────────────────────────────────────────────────
   Secure proxy: VaultOcean forwards the extraction request to the tenant's
   locally-hosted Eagle OCR server. No AI runs on VaultOcean infrastructure.
   The tenant's Eagle server must implement the connector API contract:

     POST <serverUrl>/extract
     Authorization: Bearer <apiKey>
     Content-Type: application/json
     Body: { content, mime_type, mode, custom_fields }
     Response: { columns: string[], records: Record<string,string>[] }
─────────────────────────────────────────────────────────────────────────────── */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });

  if (rateLimit(`asset-extract:${user.id}`, 8, 60_000))
    return NextResponse.json(
      { ok: false, error: "Rate limit — try again in a minute." },
      { status: 429 }
    );

  /* ── Tenant connector config ── */
  const config = await db.tenantConfig.findUnique({ where: { userId: user.id } });

  if (!config || !config.serverUrl) {
    return NextResponse.json(
      {
        ok: false,
        code: "NO_CONNECTOR",
        error:
          "No Eagle server configured. Go to Settings → AssetxOcean Connector to register your server.",
      },
      { status: 503 }
    );
  }

  if (config.status !== "active") {
    const msg =
      config.status === "pending"
        ? "Your Eagle server is pending VaultOcean approval. You will be notified once approved."
        : config.status === "approved"
        ? "Your connector has been approved. Refresh and try again."
        : "Your Eagle connector has been suspended. Contact VaultOcean support.";
    return NextResponse.json(
      { ok: false, code: "NOT_ACTIVE", status: config.status, error: msg },
      { status: 403 }
    );
  }

  /* ── Parse request body ── */
  const body = (await req.json()) as {
    content: string;
    mimeType: string;
    mode: "scope" | "nmap" | "shodan" | "custom";
    customFields?: string;
  };

  const { content, mimeType, mode, customFields } = body;
  if (!content)
    return NextResponse.json({ ok: false, error: "No content provided." }, { status: 400 });

  /* ── Forward to tenant Eagle server ── */
  const eagleUrl = config.serverUrl.replace(/\/$/, "") + "/extract";

  let eagleRes: Response;
  try {
    eagleRes = await fetch(eagleUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "X-VaultOcean-Connector": "1",
        "X-Extraction-Mode": mode,
      },
      body: JSON.stringify({
        content,
        mime_type: mimeType,
        mode,
        custom_fields: customFields ?? "",
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    return NextResponse.json(
      {
        ok: false,
        error: isTimeout
          ? "Eagle server timed out (30 s). Verify the server is running and reachable."
          : "Could not reach your Eagle server. Check the server URL and network path.",
      },
      { status: 502 }
    );
  }

  if (!eagleRes.ok) {
    const text = await eagleRes.text().catch(() => "");
    console.error(`[AssetxOcean] Eagle server ${eagleRes.status}:`, text.slice(0, 400));
    return NextResponse.json(
      { ok: false, error: `Eagle server returned ${eagleRes.status}. Check your server logs.` },
      { status: 502 }
    );
  }

  /* ── Return structured result ── */
  const data = (await eagleRes.json()) as {
    columns?: string[];
    records?: Record<string, string>[];
    error?: string;
  };

  if (data.error) {
    return NextResponse.json({ ok: false, error: data.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    columns: data.columns ?? [],
    records: data.records ?? [],
  });
}
