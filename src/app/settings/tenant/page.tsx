import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Code2, ExternalLink } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { TenantConfigForm } from "@/components/tenant-config-form";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "AssetxOcean Connector — Vault Ocean",
};

/* ── Connector API specification ─────────────────────────────────────────────
   Shown to tenant admins so they know exactly what their Eagle server
   must expose. VaultOcean is model-agnostic at this layer.
─────────────────────────────────────────────────────────────────────────────── */
const SPEC = `POST /extract
Authorization: Bearer <your-api-key>
Content-Type: application/json

{
  "content":       string,   // text content OR base64-encoded image
  "mime_type":     string,   // "text/plain" | "image/jpeg" | "image/png" | …
  "mode":          string,   // "scope" | "nmap" | "shodan" | "custom"
  "custom_fields": string    // comma-separated field names (custom mode)
}

— Success (200 OK) ——————————————————————————
{
  "columns": ["col1", "col2", …],
  "records": [
    { "col1": "value", "col2": "value" }
  ]
}

— Error (4xx / 5xx) ————————————————————————
{
  "error": "Human-readable error message"
}`;

export default async function TenantSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings/tenant");

  const raw = await db.tenantConfig.findUnique({ where: { userId: user.id } });

  const initial = raw
    ? {
        orgName:       raw.orgName,
        serverUrl:     raw.serverUrl,
        apiKeyMasked:  raw.apiKey ? "•".repeat(8) + raw.apiKey.slice(-4) : "",
        hasApiKey:     raw.apiKey.length > 0,
        maxFileSizeMb: raw.maxFileSizeMb,
        status:        raw.status as "pending" | "approved" | "active" | "suspended",
        adminNotes:    raw.adminNotes,
        updatedAt:     raw.updatedAt.toISOString(),
      }
    : null;

  return (
    <div className="py-14 sm:py-20">

      {/* Back nav */}
      <Reveal>
        <Link
          href="/assets"
          className="mb-8 inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          AssetxOcean
        </Link>

        <p className="overline">Settings</p>
        <h1 className="display display-lg mt-4 text-ink-primary">
          AssetxOcean <span className="serif-em text-tide">connector.</span>
        </h1>
        <p className="mt-5 max-w-xl leading-relaxed text-ink-secondary">
          Register your organisation&rsquo;s Eagle OCR server. VaultOcean never processes
          your documents — all extraction runs on your own infrastructure.
          We provide the interface, the connector, and secured transit only.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px]">

        {/* ── Config form ── */}
        <Reveal delay={40}>
          <section className="card p-8">
            <TenantConfigForm initial={initial} />
          </section>
        </Reveal>

        {/* ── Right panel: spec + info ── */}
        <div className="space-y-6">

          {/* API contract */}
          <Reveal delay={80}>
            <div className="card p-6">
              <div className="mb-4 flex items-center gap-2">
                <Code2 className="h-4 w-4 text-tide" />
                <p className="font-mono text-[11px] font-semibold text-zinc-300">Connector API contract</p>
              </div>
              <p className="mb-4 font-mono text-[10px] leading-relaxed text-zinc-600">
                Your Eagle server must expose one endpoint that VaultOcean will call on each
                extraction request:
              </p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-[10px] leading-relaxed text-zinc-400 ring-1 ring-zinc-800/60">
                {SPEC}
              </pre>
              <a
                href="https://github.com/NVlabs/Eagle"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] text-tide hover:text-tide-bright transition-colors"
              >
                Eagle model (NVlabs) <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </Reveal>

          {/* How it works */}
          <Reveal delay={120}>
            <div className="card p-6 space-y-4">
              <p className="font-mono text-[11px] font-semibold text-zinc-300">How it works</p>
              <ol className="space-y-3">
                {[
                  "Host the Eagle model on your own server (GPU or CPU).",
                  "Expose the /extract endpoint matching the contract above.",
                  "Register your server URL and API key here.",
                  "VaultOcean reviews and approves your registration.",
                  "Your team uploads files via AssetxOcean — VaultOcean routes them securely to your server.",
                  "Results stream back to the interface. Nothing is stored on VaultOcean infrastructure.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-mono text-[9px] font-bold text-zinc-500">
                      {i + 1}
                    </span>
                    <p className="font-mono text-[10px] leading-relaxed text-zinc-600">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>

          {/* Security note */}
          <Reveal delay={140}>
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-5">
              <p className="font-mono text-[10px] leading-relaxed text-zinc-600">
                <span className="text-zinc-400 font-semibold">Security: </span>
                All traffic between VaultOcean and your server must use HTTPS in production.
                Your API key is stored encrypted and never returned in full after saving.
                Changing the server URL or key automatically resets your connector to pending
                for security re-review.
              </p>
            </div>
          </Reveal>

        </div>
      </div>
    </div>
  );
}
