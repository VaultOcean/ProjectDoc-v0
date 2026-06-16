"use client";

export function PaletteButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("vo:open-palette"))}
      className={className}
    >
      {children}
    </button>
  );
}
