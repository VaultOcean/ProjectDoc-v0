import { cn } from "@/lib/cn";

export function SectionHeading({
  marker,
  title,
  description,
  className,
}: {
  marker: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <p className="label-mono">// {marker}</p>
      <h2 className="mt-2 text-2xl font-medium tracking-tight text-ink-primary sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
          {description}
        </p>
      )}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  live: "text-tide border-tide/30",
  beta: "text-sev-medium border-sev-medium/30",
  soon: "text-ink-muted border-hair",
  alpha: "text-sev-high border-sev-high/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        STATUS_STYLES[status] ?? STATUS_STYLES.soon
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

const SEV_STYLES: Record<string, string> = {
  critical: "text-sev-critical border-sev-critical/30 bg-sev-critical/10",
  high: "text-sev-high border-sev-high/30 bg-sev-high/10",
  medium: "text-sev-medium border-sev-medium/30 bg-sev-medium/10",
  low: "text-sev-low border-sev-low/30 bg-sev-low/10",
};

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        SEV_STYLES[severity] ?? SEV_STYLES.low
      )}
    >
      {severity}
    </span>
  );
}

export function Fathoms({ value }: { value: number }) {
  return (
    <span className="font-mono text-tide">
      {value.toLocaleString()}
      <span className="ml-0.5 text-[11px] text-ink-muted">ƒ</span>
    </span>
  );
}
