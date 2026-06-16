import { cn } from "@/lib/cn";

export function PageHeader({
  label,
  marker,
  title,
  serif,
  description,
  children,
  className,
}: {
  label?: string;
  marker?: string;
  title: string;
  serif?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const eyebrow = label ?? marker;
  return (
    <header className={cn("border-b border-hair pb-12 pt-14 sm:pb-16 sm:pt-20", className)}>
      {eyebrow && <p className="overline">{eyebrow}</p>}
      <h1 className={cn("display display-lg mt-4 text-ink-primary", !eyebrow && "mt-0")}>
        {title}
        {serif && (
          <>
            {" "}
            <span className="serif-em text-tide">{serif}</span>
          </>
        )}
      </h1>
      {description && (
        <p className="mt-5 max-w-2xl leading-relaxed text-ink-secondary">{description}</p>
      )}
      {children && <div className="mt-7">{children}</div>}
    </header>
  );
}

export function ComingSoon({ note }: { note: string }) {
  return (
    <div className="card mt-12 flex flex-col items-start gap-4 p-8 sm:p-10">
      <span className="pill text-tide">on the roadmap</span>
      <p className="max-w-xl leading-relaxed text-ink-secondary">{note}</p>
    </div>
  );
}
