"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, BookOpen, Flag, PenLine, Wrench, Command, LogOut, Settings,
  Bell, Bookmark, Search, FileText, TerminalSquare, Target, ShieldAlert,
  Library, DollarSign, Globe, ChevronDown, ChevronRight, Database, FileSearch2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Wordmark } from "@/components/brand";
import { useEffect, useState } from "react";

export type NavUser = { handle: string; streakDays: number; fathoms: number } | null;

/* ── Nav structure ─────────────────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    key: "workspace",
    label: "Workspace",
    items: [
      { href: "/",          label: "Dashboard",   icon: Home },
      { href: "/targets",   label: "Engagements", icon: Target },
      { href: "/reports",   label: "Reports",     icon: ShieldAlert },
      { href: "/earnings",  label: "Earnings",    icon: DollarSign },
      { href: "/workspace", label: "Notes",       icon: PenLine },
    ],
  },
  {
    key: "tools",
    label: "Tools",
    items: [
      { href: "/terminal",    label: "Terminal",     icon: TerminalSquare },
      { href: "/tools",       label: "Arsenal",      icon: Wrench },
      { href: "/assets",      label: "AssetxOcean",  icon: Database },
      { href: "/docx",        label: "Docx",         icon: FileSearch2 },
      { href: "/payloads",    label: "Payloads",     icon: Library },
      { href: "/cheatsheets", label: "Cheatsheets",  icon: FileText },
      { href: "/programs",    label: "Programs",     icon: Globe },
    ],
  },
  {
    key: "community",
    label: "Community",
    items: [
      { href: "/writeups", label: "Field", icon: BookOpen },
      { href: "/arena",    label: "Lab",   icon: Flag },
      { href: "/posts",    label: "Posts", icon: FileText },
    ],
  },
] as const;

const MOBILE_NAV = [
  { href: "/",         label: "Home",     icon: Home },
  { href: "/targets",  label: "Work",     icon: Target },
  { href: "/terminal", label: "Terminal", icon: TerminalSquare },
  { href: "/reports",  label: "Reports",  icon: ShieldAlert },
  { href: "/writeups", label: "Field",    icon: BookOpen },
] as const;

function openPalette() {
  window.dispatchEvent(new Event("vo:open-palette"));
}

/* ── NavItem ────────────────────────────────────────────────────────────────── */
function NavItem({
  href, label, icon: Icon, active, collapsed,
}: {
  href: string; label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean; collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-tide/10 text-tide"
          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
        collapsed && "justify-center px-0"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-tide" : "text-zinc-500 group-hover:text-zinc-300")} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

/* ── NavSection ─────────────────────────────────────────────────────────────── */
function NavSection({
  groupKey, label, items, pathname, collapsed,
}: {
  groupKey: string; label: string;
  items: readonly { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  pathname: string; collapsed: boolean;
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(`vo:nav:${groupKey}`);
    if (saved !== null) setOpen(saved === "1");
  }, [groupKey]);

  function toggle() {
    const next = !open;
    setOpen(next);
    localStorage.setItem(`vo:nav:${groupKey}`, next ? "1" : "0");
  }

  return (
    <div className={collapsed ? undefined : "mb-0.5"}>
      {!collapsed && (
        <button
          onClick={toggle}
          className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          {label}
          {open
            ? <ChevronDown className="h-2.5 w-2.5" />
            : <ChevronRight className="h-2.5 w-2.5" />}
        </button>
      )}
      {(open || collapsed) && (
        <div className={cn(collapsed ? "mt-1 space-y-0.5" : "space-y-0.5")}>
          {items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <NavItem key={item.href} href={item.href} label={item.label}
                icon={item.icon} active={active} collapsed={collapsed} />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── AppSidebar ─────────────────────────────────────────────────────────────── */
function AppSidebar({
  user,
  entitledTools,
}: {
  user: NonNullable<NavUser>;
  entitledTools: string[];
}) {
  const pathname  = usePathname();
  const initials  = user.handle.slice(0, 2).toUpperCase();
  const [unread, setUnread]     = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("vo:sidebar:collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("vo:sidebar:collapsed", next ? "1" : "0");
  }

  useEffect(() => {
    const poll = () =>
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((d: { unreadCount?: number }) => setUnread(d.unreadCount ?? 0))
        .catch(() => null);
    poll();
    const iv = setInterval(poll, 60_000);
    return () => clearInterval(iv);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  const sidebarW = collapsed ? "w-[48px]" : "w-[210px]";

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col transition-[width] duration-200",
        "border-r border-white/[0.06] bg-[#0d0d10]",
        sidebarW
      )}
    >
      {/* Logo row */}
      <div className={cn(
        "flex h-11 shrink-0 items-center border-b border-white/[0.06]",
        collapsed ? "justify-center" : "gap-2 px-3"
      )}>
        {!collapsed && (
          <Link href="/" aria-label="VaultOcean home" className="flex-1 min-w-0">
            <Wordmark />
          </Link>
        )}
        <button
          onClick={toggleCollapsed}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-600 hover:bg-white/5 hover:text-zinc-400 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed
            ? <ChevronRight className="h-3.5 w-3.5" />
            : <ChevronDown className="h-3.5 w-3.5 rotate-90" />}
        </button>
      </div>

      {/* Nav groups — scrollable */}
      <nav
        className={cn(
          "flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-1.5 py-2 scrollbar-none",
          collapsed ? "space-y-0" : "space-y-3"
        )}
        aria-label="App navigation"
      >
        {NAV_GROUPS.map((g) => {
          // The "tools" group is entitlement-gated: only modules the user has
          // been granted appear. Other groups (workspace, community) are shown
          // as the base experience. Empty groups are hidden entirely.
          const items =
            g.key === "tools"
              ? g.items.filter((it) => entitledTools.includes(it.href))
              : g.items;
          if (items.length === 0) return null;
          return (
            <NavSection
              key={g.key}
              groupKey={g.key}
              label={g.label}
              items={items}
              pathname={pathname}
              collapsed={collapsed}
            />
          );
        })}
      </nav>

      {/* ── Compact bottom bar ───────────────────────────────── */}
      <div className="shrink-0 border-t border-white/[0.06] px-1.5 py-2">

        {/* Profile chip */}
        <Link
          href={`/profile/${user.handle}`}
          title={user.handle}
          className={cn(
            "flex items-center gap-2 rounded-md px-1.5 py-1.5 transition-colors hover:bg-white/5",
            collapsed && "justify-center"
          )}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-mono text-[9px] font-bold uppercase text-tide ring-1 ring-tide/25">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[11px] font-medium text-zinc-300">@{user.handle}</p>
              <p className="font-mono text-[9px] text-zinc-600">{user.fathoms.toLocaleString()}ƒ · {user.streakDays}d streak</p>
            </div>
          )}
        </Link>

        {/* Utility icon row — expanded: all 6 icons in a row; collapsed: 3 icons stacked */}
        {collapsed ? (
          /* Collapsed: only Bell + Settings + Sign out to stay compact */
          <div className="mt-1 flex flex-col items-center gap-0.5">
            <Link href="/notifications" title="Notifications" onClick={() => setUnread(0)}
              className="relative flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-white/5 hover:text-zinc-400 transition-colors">
              <Bell className="h-3.5 w-3.5" />
              {unread > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-tide font-mono text-[8px] font-bold text-abyss-900">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <Link href="/settings" title="Settings"
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-white/5 hover:text-zinc-400 transition-colors">
              <Settings className="h-3.5 w-3.5" />
            </Link>
            <button onClick={logout} title="Sign out"
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-700 hover:bg-white/5 hover:text-red-400 transition-colors">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          /* Expanded: full row */
          <div className="mt-1 flex items-center gap-0.5 px-1">
            <Link href="/search" title="Search"
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-white/5 hover:text-zinc-400 transition-colors">
              <Search className="h-3.5 w-3.5" />
            </Link>
            <button onClick={openPalette} title="Command palette ⌘K"
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-white/5 hover:text-zinc-400 transition-colors">
              <Command className="h-3.5 w-3.5" />
            </button>
            <Link href="/notifications" title="Notifications" onClick={() => setUnread(0)}
              className="relative flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-white/5 hover:text-zinc-400 transition-colors">
              <Bell className="h-3.5 w-3.5" />
              {unread > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-tide font-mono text-[8px] font-bold text-abyss-900">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <Link href="/bookmarks" title="Bookmarks"
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-white/5 hover:text-zinc-400 transition-colors">
              <Bookmark className="h-3.5 w-3.5" />
            </Link>
            <Link href="/settings" title="Settings"
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-white/5 hover:text-zinc-400 transition-colors">
              <Settings className="h-3.5 w-3.5" />
            </Link>
            <button onClick={logout} title="Sign out"
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-700 hover:bg-white/5 hover:text-red-400 transition-colors">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── Mobile bottom nav ──────────────────────────────────────────────────────── */
function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/[0.06] bg-[#0d0d10]/95 backdrop-blur-md sm:hidden">
      {MOBILE_NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 text-[9px] font-mono uppercase tracking-widest transition-colors",
              active ? "text-tide" : "text-zinc-600 hover:text-zinc-400"
            )}>
            <item.icon className={cn("h-5 w-5", active ? "text-tide" : "")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ── SiteChrome ─────────────────────────────────────────────────────────────── */
export function SiteChrome({
  nav, footer, palette, children, user, entitledTools = [],
}: {
  nav: React.ReactNode;
  footer: React.ReactNode;
  palette: React.ReactNode;
  children: React.ReactNode;
  user: NavUser;
  entitledTools?: string[];
}) {
  const path = usePathname() || "/";
  if (path.startsWith("/console")) return <>{children}</>;

  if (user) {
    return (
      <>
        <div className="sm:hidden">{nav}</div>
        <div className="flex min-h-dvh bg-[#0b0b0e]">
          <div className="hidden sm:flex">
            <AppSidebar user={user} entitledTools={entitledTools} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            {palette}
            <main id="main" className="flex-1 pb-20 sm:pb-0">
              {children}
            </main>
          </div>
        </div>
        <MobileNav pathname={path} />
      </>
    );
  }

  const isLanding = path === "/";
  return (
    <>
      {nav}
      {palette}
      <main id="main" className={isLanding ? "w-full" : "mx-auto w-full max-w-6xl px-5 sm:px-8"}>
        {children}
      </main>
      {footer}
    </>
  );
}
