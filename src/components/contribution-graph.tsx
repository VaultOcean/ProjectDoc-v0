import { cn } from "@/lib/cn";

const LEVELS = [
  "bg-abyss-600",
  "bg-tide/25",
  "bg-tide/45",
  "bg-tide/70",
  "bg-tide",
];

/**
 * GitHub-style activity grid. `data` is a flat array of intensities (0..4)
 * laid out column-major: 7 rows (days) per week column.
 */
export function ContributionGraph({
  data,
  weeks = 52,
}: {
  data: number[];
  weeks?: number;
}) {
  const cells = data.slice(0, weeks * 7);

  return (
    <div className="overflow-x-auto pb-1">
      <div
        className="grid grid-flow-col gap-[3px]"
        style={{ gridTemplateRows: "repeat(7, 1fr)" }}
        role="img"
        aria-label={`Activity over the last ${weeks} weeks`}
      >
        {cells.map((level, i) => (
          <span
            key={i}
            className={cn(
              "h-2.5 w-2.5 rounded-[2px] transition-colors",
              LEVELS[Math.max(0, Math.min(4, level))]
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function ContributionLegend() {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px] text-ink-muted">
      <span>less</span>
      {LEVELS.map((c, i) => (
        <span key={i} className={cn("h-2.5 w-2.5 rounded-[2px]", c)} />
      ))}
      <span>more</span>
    </div>
  );
}
