import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-mono text-sm text-tide">404 · lost at depth</p>
      <h1 className="mt-3 text-3xl font-medium tracking-tight">Nothing surfaced here</h1>
      <p className="mt-3 max-w-sm text-sm text-ink-secondary">
        The page you were looking for has drifted out of range.
      </p>
      <Link href="/" className="btn-tide mt-7">
        Back to the surface
      </Link>
    </div>
  );
}
