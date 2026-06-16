"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, BookOpen, Flag, User, PenLine,
  Loader2, ArrowUpRight, Flame,
} from "lucide-react";

type Writeup  = { slug: string; title: string; summary: string; category: string; severity: string; readMinutes: number };
type Challenge = { slug: string; title: string; category: string; difficulty: string; fathoms: number };
type UserHit  = { handle: string; displayName: string; fathoms: number; streakDays: number };
type Doc      = { slug: string; title: string; summary: string; readMinutes: number; author: { handle: string; displayName: string } };

type Results = { writeups: Writeup[]; challenges: Challenge[]; users: UserHit[]; docs: Doc[] };

const SEV_COLOR: Record<string, string> = {
  critical: "text-sev-critical border-sev-critical/30 bg-sev-critical/10",
  high:     "text-sev-high border-sev-high/30 bg-sev-high/10",
  medium:   "text-sev-medium border-sev-medium/30 bg-sev-medium/10",
  low:      "text-sev-low border-sev-low/30 bg-sev-low/10",
};

const DIFF_COLOR: Record<string, string> = {
  easy:   "text-sev-low border-sev-low/30",
  medium: "text-sev-medium border-sev-medium/30",
  hard:   "text-sev-high border-sev-high/30",
  insane: "text-sev-critical border-sev-critical/30",
};

function ResultSection<T extends object>({
  label,
  icon: Icon,
  items,
  render,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: T[];
  render: (item: T) => React.ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-tide" />
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">{label}</p>
        <span className="ml-1 rounded-full border border-hair px-2 py-0.5 font-mono text-[9px] text-ink-faint">
          {items.length}
        </span>
      </div>
      <div className="space-y-2">{items.map(render)}</div>
    </section>
  );
}

function SearchResults({ q }: { q: string }) {
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    const ctrl = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: Results) => setResults(d))
      .catch(() => null)
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [q]);

  const total = results
    ? results.writeups.length + results.challenges.length + results.users.length + results.docs.length
    : 0;

  if (q.length < 2) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <Search className="h-10 w-10 text-ink-faint" />
        <p className="text-sm text-ink-muted">Type at least 2 characters to search.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-ink-faint">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="font-mono text-sm">Searching…</span>
      </div>
    );
  }

  if (!results || total === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <Search className="h-10 w-10 text-ink-faint" />
        <p className="text-sm text-ink-muted">No results for <span className="text-ink-primary">"{q}"</span></p>
        <p className="text-xs text-ink-faint">Try different keywords.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-mono text-[11px] text-ink-faint">
        {total} result{total !== 1 ? "s" : ""} for <span className="text-ink-secondary">"{q}"</span>
      </p>

      <ResultSection
        label="Writeups"
        icon={BookOpen}
        items={results.writeups}
        render={(w) => (
          <Link
            key={w.slug}
            href={`/writeups/${w.slug}`}
            className="group flex items-start gap-3 rounded-xl border border-hair bg-abyss-800/40 px-4 py-3 transition-colors hover:border-hover"
          >
            <span className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase ${SEV_COLOR[w.severity] ?? "text-ink-muted border-hair"}`}>
              {w.severity}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm font-medium text-ink-primary transition-colors group-hover:text-tide">
                {w.title}
              </p>
              <p className="mt-0.5 truncate text-xs text-ink-muted">{w.summary}</p>
            </div>
            <span className="shrink-0 font-mono text-[10px] text-ink-faint">{w.readMinutes} min</span>
            <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint transition-colors group-hover:text-tide" />
          </Link>
        )}
      />

      <ResultSection
        label="Challenges"
        icon={Flag}
        items={results.challenges}
        render={(c) => (
          <Link
            key={c.slug}
            href={`/arena/${c.slug}`}
            className="group flex items-center gap-3 rounded-xl border border-hair bg-abyss-800/40 px-4 py-3 transition-colors hover:border-hover"
          >
            <span className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase ${DIFF_COLOR[c.difficulty] ?? "text-ink-muted border-hair"}`}>
              {c.difficulty}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm font-medium text-ink-primary transition-colors group-hover:text-tide">
                {c.title}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-ink-faint">{c.category}</p>
            </div>
            <span className="shrink-0 font-mono text-[10px] text-tide">{c.fathoms}ƒ</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-ink-faint transition-colors group-hover:text-tide" />
          </Link>
        )}
      />

      <ResultSection
        label="Users"
        icon={User}
        items={results.users}
        render={(u) => (
          <Link
            key={u.handle}
            href={`/profile/${u.handle}`}
            className="group flex items-center gap-3 rounded-xl border border-hair bg-abyss-800/40 px-4 py-3 transition-colors hover:border-hover"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-abyss-600 font-mono text-[10px] uppercase text-tide ring-1 ring-tide/30">
              {u.handle.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm font-medium text-ink-primary transition-colors group-hover:text-tide">
                {u.displayName}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-ink-faint">@{u.handle}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 font-mono text-[10px] text-ink-faint">
              <span className="text-tide">{u.fathoms.toLocaleString()}ƒ</span>
              {u.streakDays > 0 && (
                <span className="flex items-center gap-0.5 text-sev-high">
                  <Flame className="h-3 w-3" />
                  {u.streakDays}
                </span>
              )}
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-ink-faint transition-colors group-hover:text-tide" />
          </Link>
        )}
      />

      <ResultSection
        label="Docs"
        icon={PenLine}
        items={results.docs}
        render={(d) => (
          <Link
            key={`${d.author.handle}/${d.slug}`}
            href={`/u/${d.author.handle}/${d.slug}`}
            className="group flex items-start gap-3 rounded-xl border border-hair bg-abyss-800/40 px-4 py-3 transition-colors hover:border-hover"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm font-medium text-ink-primary transition-colors group-hover:text-tide">
                {d.title || "Untitled"}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-ink-faint">
                by @{d.author.handle} · {d.readMinutes} min
              </p>
            </div>
            <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint transition-colors group-hover:text-tide" />
          </Link>
        )}
      />
    </div>
  );
}

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleChange(val: string) {
    setQ(val);
    const url = val.length >= 2 ? `/search?q=${encodeURIComponent(val)}` : "/search";
    router.replace(url, { scroll: false });
  }

  return (
    <div className="py-14 sm:py-20">
      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search writeups, challenges, users, docs…"
          className="w-full rounded-xl border border-hair bg-abyss-800/60 py-3 pl-12 pr-4 text-base text-ink-primary outline-none placeholder:text-ink-faint focus:border-tide/40 focus:ring-1 focus:ring-tide/20 transition-colors"
        />
      </div>

      <SearchResults q={q} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}
