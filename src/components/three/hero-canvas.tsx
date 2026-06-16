"use client";

import dynamic from "next/dynamic";

// WebGL must not run on the server — load the scene client-only.
const OrbScene = dynamic(() => import("./orb-scene"), { ssr: false, loading: () => null });

export function HeroCanvas({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <OrbScene />
    </div>
  );
}
