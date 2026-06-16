import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Cpu, Database, Globe, ScanLine, Settings2, AlertCircle } from "lucide-react";
import { AssetScanner } from "@/components/asset-scanner";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "AssetxOcean — Vault Ocean",
  description:
    "Smart asset inventory. Drop security documents and extract structured data via your organisation's Eagle OCR server.",
};

const CAPABILITIES = [
  {
    icon: Globe,
    label: "Scope Parser",
    color: "text-cyan-400",
    desc: "Scope PDFs — extract domains, IPs, bounty ranges, exclusion rules.",
  },
  {
    icon: ScanLine,
    label: "Nmap Intelligence",
    color: "text-green-400",
    desc: "Nmap XML/text → structured host, port, service, version table.",
  },
  {
    icon: Database,
    label: "Shodan / Censys",
    color: "text-orange-400",
    desc: "Export JSON → banner, CVE, ASN, org metadata mapped automatically.",
  },
  {
    icon: Cpu,
    label: "Custom Fields",
    color: "text-violet-400",
    desc: "Define any fields — your Eagle server maps them from any document.",
  },
];

export default async function AssetsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/assets");

  const config = await db.tenantConfig.findUnique({ where: { userId: user.id } });
  const connectorStatus = config?.status ?? null;
  const isReady = connectorStatus === "active";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">AssetxOcean</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Drop any security document — scope PDF, Nmap output, Shodan export, or raw text.
            Your Eagle OCR server extracts structured asset data you can filter, sort, and export.
          </p>
        </div>
        <div className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 ${
          isReady ? "border-tide/20 bg-tide/5" : "border-zinc-700/60 bg-zinc-900/40"
        }`}>
          <div className={`h-1.5 w-1.5 rounded-full ${isReady ? "animate-pulse bg-tide" : "bg-zinc-600"}`} />
          <span className={`font-mono text-[11px] ${isReady ? "text-tide" : "text-zinc-500"}`}>
            {isReady
              ? "Connector active"
              : connectorStatus === "pending"
              ? "Awaiting approval"
              : "Not configured"}
          </span>
        </div>
      </div>

      {/* Capabilities strip */}
      <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {CAPABILITIES.map((c) => (
          <div key={c.label} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <c.icon className={`mt-0.5 h-4 w-4 shrink-0 ${c.color}`} />
            <div>
              <p className="text-xs font-semibold text-zinc-300">{c.label}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-600">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Connector notice */}
      {!isReady && (
        <div className={`mb-6 flex flex-wrap items-start gap-4 rounded-xl border p-4 ${
          connectorStatus === "pending"
            ? "border-yellow-900/40 bg-yellow-950/10"
            : "border-zinc-700/60 bg-zinc-900/20"
        }`}>
          <AlertCircle className={`mt-0.5 h-4 w-4 shrink-0 ${
            connectorStatus === "pending" ? "text-yellow-500" : "text-zinc-500"
          }`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-300">
              {connectorStatus === "pending"
                ? "Connector pending approval"
                : "Eagle server not configured"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-600">
              {connectorStatus === "pending"
                ? "VaultOcean is reviewing your server registration. You will be notified once approved."
                : "AssetxOcean routes extractions to your organisation's Eagle OCR server. Register yours to begin."}
            </p>
          </div>
          <Link
            href="/settings/tenant"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:border-tide/40 hover:text-tide transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5" />
            {connectorStatus === "pending" ? "View settings" : "Configure connector"}
          </Link>
        </div>
      )}

      {/* Extract section header */}
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Extract</h2>
        <span className="h-px flex-1 bg-zinc-800" />
        {isReady && (
          <Link
            href="/settings/tenant"
            className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <Settings2 className="h-3 w-3" />
            Connector settings
          </Link>
        )}
      </div>

      <AssetScanner connectorStatus={connectorStatus} />

      <p className="mt-6 text-[11px] text-zinc-700">
        Files are read locally in your browser. Content is forwarded only to your
        organisation&rsquo;s registered Eagle server — VaultOcean does not store or process
        document content.
      </p>
    </div>
  );
}
