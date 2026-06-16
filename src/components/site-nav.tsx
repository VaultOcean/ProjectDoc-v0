"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Flame, Menu, X, Command } from "lucide-react";
import { cn } from "@/lib/cn";
import { Wordmark } from "@/components/brand";

const NAV = [
  { href: "/writeups",  label: "Field"   },
  { href: "/arena",     label: "Lab"     },
  { href: "/workspace", label: "Draft"   },
  { href: "/tools",     label: "Arsenal" },
];

function openPalette() {
  window.dispatchEvent(new Event("vo:open-palette"));
}

type NavUser = { handle: string; streakDays: number; fathoms: number } | null;

export function SiteNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = user ? user.handle.slice(0, 2).toUpperCase() : "";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-hair bg-abyss-900/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-5 sm:px-8">

        {/* Logo */}
        <Link href="/" aria-label="Vault Ocean home" className="shrink-0 outline-none">
          <Wordmark />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center md:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3 py-2 text-sm transition-colors",
                  active
                    ? "text-tide"
                    : "text-ink-muted hover:text-ink-primary"
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-3 bottom-0 h-px bg-tide/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2.5">

          {/* ⌘K */}
          <button
            type="button"
            onClick={openPalette}
            className="hidden items-center gap-1.5 rounded-lg border border-hair px-2.5 py-1.5 font-mono text-[11px] text-ink-muted transition-colors hover:border-hover hover:text-tide sm:flex"
            aria-label="Open command palette"
          >
            <Command className="h-3.5 w-3.5" aria-hidden="true" />K
          </button>

          {user ? (
            <>
              {/* Streak badge */}
              <span
                className="hidden items-center gap-1 rounded-full border border-sev-high/25 bg-sev-high/8 px-2.5 py-1 font-mono text-[11px] text-sev-high sm:flex"
                title={`${user.streakDays}-day streak`}
              >
                <Flame className="h-3 w-3" aria-hidden="true" />
                {user.streakDays}d
              </span>

              {/* Avatar chip */}
              <Link
                href={`/profile/${user.handle}`}
                className="hidden h-8 items-center gap-2 rounded-full border border-hair bg-abyss-700/60 pl-1 pr-3 text-xs transition-colors hover:border-hover sm:flex"
                title="Your profile"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-abyss-500 font-mono text-[9px] text-tide">
                  {initials}
                </span>
                <span className="font-mono text-ink-secondary">{user.handle}</span>
              </Link>

              <button
                type="button"
                onClick={logout}
                className="btn-ghost hidden text-xs sm:inline-flex"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-lg border border-tide/25 px-4 py-1.5 font-mono text-xs font-medium text-tide transition-all hover:border-tide/50 hover:bg-tide/8 sm:inline-flex"
            >
              Sign in
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-hair text-ink-secondary md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav
          className="border-t border-hair bg-abyss-800/95 px-5 py-4 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="space-y-1">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-abyss-600/60 text-tide"
                      : "text-ink-secondary hover:bg-abyss-600/40 hover:text-ink-primary"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 border-t border-hair pt-4">
            {user ? (
              <div className="flex gap-2">
                <Link
                  href={`/profile/${user.handle}`}
                  onClick={() => setOpen(false)}
                  className="btn-ghost flex-1 justify-center text-sm"
                >
                  {user.handle}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="btn-ghost flex-1 justify-center text-sm"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="btn-tide w-full justify-center text-sm"
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
