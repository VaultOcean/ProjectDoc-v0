import Link from "next/link";
import { redirect } from "next/navigation";
import { Globe, Radar } from "lucide-react";
import { LiveSurfaceMap } from "@/components/console/live-surface-map";
import { getCurrentUser } from "@/lib/auth";
import { getAllScans } from "@/lib/queries";
import { deriveAssets } from "@/lib/derive";

export default async function AssetsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/console/assets");
  const scans = await getAllScans(user.id);
  const { assets, hosts, subdomains } = deriveAssets(scans);
  const subNames = assets.filter((a) => a.kind === "subdomain").map((a) => a.host);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="c-rise">
        <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>Assets</p>
        <h1 className="mt-1 text-[28px] font-medium tracking-tight sm:text-[32px]">
          Your <span className="c-grad-text">asset universe.</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px]" style={{ color: "var(--c-muted)" }}>
          Every host and subdomain VaultOcean has discovered across your scans, consolidated into one inventory.
        </p>
      </header>

      {assets.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Total assets" value={assets.length} />
            <Stat label="Scanned hosts" value={hosts} />
            <Stat label="Subdomains found" value={subdomains} />
          </div>

          {subNames.length > 0 && (
            <div className="c-card c-rise">
              <div className="flex items-center justify-between px-6 pt-5">
                <p className="text-[15px] font-medium">Surface map</p>
                <span className="c-chip"><Globe className="h-3 w-3" /> {subNames.length} mapped</span>
              </div>
              <div className="h-[320px] px-2 pb-2">
                <LiveSurfaceMap center={assets[0].host} assets={subNames} />
              </div>
            </div>
          )}

          <div className="c-card c-rise overflow-hidden">
            <table className="w-full text-left text-[13.5px]">
              <thead style={{ color: "var(--c-faint)" }}>
                <tr className="text-[11px] uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Host</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Addresses</th>
                  <th className="px-4 py-3 font-medium">Grade</th>
                  <th className="px-6 py-3 font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.host} style={{ borderTop: "1px solid var(--c-border)" }}>
                    <td className="px-6 py-3 font-mono">{a.host}</td>
                    <td className="px-4 py-3"><span className="c-chip">{a.kind}</span></td>
                    <td className="px-4 py-3" style={{ color: "var(--c-muted)" }}>{a.ips.join(", ") || "—"}</td>
                    <td className="px-4 py-3" style={{ color: "var(--c-muted)" }}>{a.grade ?? "—"}</td>
                    <td className="px-6 py-3" style={{ color: "var(--c-faint)" }}>{new Date(a.lastSeen).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="c-card c-rise c-hover p-5">
      <p className="text-[12px]" style={{ color: "var(--c-muted)" }}>{label}</p>
      <p className="mt-1.5 text-[28px] font-medium leading-none tracking-tight">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="c-card c-rise flex flex-col items-start gap-3 p-10">
      <Radar className="h-6 w-6" style={{ color: "var(--c-accent)" }} />
      <p className="text-[15px]" style={{ color: "var(--c-muted)" }}>No assets yet — run a scan and they appear here.</p>
      <Link href="/console" className="c-btn c-btn-accent">Run a scan</Link>
    </div>
  );
}
