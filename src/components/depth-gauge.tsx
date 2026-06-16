"use client";

const ZONES = [
  { label: "Surface",  threshold: "0ƒ" },
  { label: "Shallows", threshold: "250ƒ" },
  { label: "Twilight", threshold: "750ƒ" },
  { label: "Midnight", threshold: "1,500ƒ" },
  { label: "Abyssal",  threshold: "3,000ƒ" },
  { label: "Hadal",    threshold: "6,000ƒ" },
];

export function DepthGauge({ className }: { className?: string }) {
  return (
    <div className={`select-none font-mono ${className ?? ""}`} aria-hidden="true">
      <div className="w-[300px] overflow-hidden rounded-2xl border border-hair bg-abyss-800/70 backdrop-blur-sm">

        {/* Terminal header */}
        <div className="flex items-center justify-between border-b border-hair px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-[9px] uppercase tracking-[0.22em] text-ink-muted">
            depth.gauge
          </span>
          <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-tide">
            <span className="dg-status-dot inline-block h-1.5 w-1.5 rounded-full bg-tide" />
            live
          </span>
        </div>

        {/* Body: sonar + depth scale */}
        <div className="flex">

          {/* Sonar display */}
          <div className="relative flex flex-1 items-center justify-center py-8">
            <div className="relative h-36 w-36">

              {/* Crosshair */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-1/2 h-px w-full -translate-y-px bg-tide/[0.05]" />
                <div className="absolute left-1/2 h-full w-px -translate-x-px bg-tide/[0.05]" />
              </div>

              {/* Static reference rings */}
              {[144, 96, 48].map((size) => (
                <div
                  key={size}
                  className="absolute rounded-full border border-tide/[0.07]"
                  style={{
                    width: size,
                    height: size,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%,-50%)",
                  }}
                />
              ))}

              {/* Animated pulse rings — three staggered via CSS nth-child */}
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="sonar-ring absolute inset-0 rounded-full border border-tide/60"
                />
              ))}

              {/* Center blip */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="h-6 w-6 rounded-full bg-tide/15" />
                <div
                  className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-tide"
                  style={{ boxShadow: "0 0 8px rgba(46,230,214,0.8)" }}
                />
              </div>
            </div>
          </div>

          {/* Depth scale */}
          <div className="relative w-24 border-l border-hair py-4 pl-3 pr-4">
            {/* Track line */}
            <div className="absolute bottom-4 left-3 top-4 w-px bg-tide/[0.12]">
              {/* Animated cursor */}
              <div className="dg-cursor absolute -left-[3px]">
                <div
                  className="h-1.5 w-1.5 rounded-full bg-tide"
                  style={{ boxShadow: "0 0 6px rgba(46,230,214,0.7)" }}
                />
              </div>
            </div>

            {/* Zone labels */}
            <div className="ml-3 flex h-full flex-col justify-between">
              {ZONES.map((z) => (
                <div key={z.label} className="leading-none">
                  <p className="text-[9px] uppercase tracking-widest text-ink-muted">
                    {z.label}
                  </p>
                  <p className="text-[8px] text-ink-faint">{z.threshold}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Readout bar */}
        <div className="border-t border-hair bg-abyss-900/40 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-ink-muted">
              depth <span className="ml-1 text-ink-secondary">2,847ƒ</span>
            </span>
            <span className="text-[9px] uppercase tracking-widest text-ink-muted">
              rank <span className="ml-1 text-tide">midnight</span>
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[8px] text-ink-faint">
            <span className="text-tide">$</span>
            <span>scanning current depth</span>
            <span className="caret" />
          </div>
        </div>

      </div>
    </div>
  );
}
