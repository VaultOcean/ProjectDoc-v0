import { redirect } from "next/navigation";
import { ScanExperience } from "@/components/console/scan-experience";
import { getCurrentUser } from "@/lib/auth";
import { getLatestScan } from "@/lib/queries";

export default async function SurfacePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/console/surface");
  const latest = await getLatestScan(user.id);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="c-rise">
        <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>Attack Surface</p>
        <h1 className="mt-1 text-[28px] font-medium tracking-tight sm:text-[32px]">
          Every asset, <span className="c-grad-text">surfaced.</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px]" style={{ color: "var(--c-muted)" }}>
          Discover a domain&apos;s public footprint from certificate-transparency logs and DNS, scored by its live header posture.
        </p>
      </header>
      <ScanExperience initial={latest} />
    </div>
  );
}
