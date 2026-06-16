"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, Radar, Globe, Shield,
  BarChart3, Search, Bell, PanelLeftClose, PanelLeft, Check, Waves,
} from "lucide-react";
import { MODULES } from "@/lib/console-data";

const ICONS: Record<string, typeof LayoutGrid> = {
  overview: LayoutGrid, surface: Radar, assets: Globe, vulnerabilities: Shield, reports: BarChart3,
};

const GROUPS: { key: string; label: string }[] = [
  { key: "main", label: "Operate" },
  { key: "intel", label: "Intelligence" },
];

const THEMES = [
  { id: "deep-ocean", label: "Deep Ocean", swatch: "linear-gradient(135deg,#4aa8ff,#2ee6d6)" },
  { id: "midnight", label: "Midnight", swatch: "linear-gradient(135deg,#8b9bff,#c4b5fd)" },
  { id: "aurora", label: "Aurora", swatch: "linear-gradient(135deg,#38bdf8,#818cf8)" },
  { id: "graphite", label: "Graphite", swatch: "linear-gradient(135deg,#aab9ce,#d6e0ec)" },
  { id: "arctic", label: "Arctic", swatch: "linear-gradient(135deg,#1f7bff,#0bb5c9)" },
];

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState("deep-ocean");
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("vo-console-theme");
    if (saved) setTheme(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("vo-console-theme", theme);
  }, [theme]);

  return (
    <div className="console" data-ctheme={theme}>
      <div className="flex min-h-dvh">
        {/* Sidebar */}
        <aside
          className="sticky top-0 hidden h-dvh shrink-0 flex-col gap-1 p-3 transition-all duration-300 md:flex"
          style={{ width: collapsed ? 76 : 248 }}
        >
          <Link href="/console" className="mb-4 flex items-center gap-2.5 px-2 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl c-accent-bar text-[#04121f]">
              <Waves className="h-5 w-5" />
            </span>
            {!collapsed && (
              <span className="text-[15px] font-medium tracking-tight">
                Vault<span className="c-grad-text">Ocean</span>
              </span>
            )}
          </Link>

          <nav className="flex-1 space-y-5 overflow-y-auto">
            {GROUPS.map((g) => (
              <div key={g.key}>
                {!collapsed && (
                  <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-[0.16em]" style={{ color: "var(--c-faint)" }}>
                    {g.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {MODULES.filter((m) => m.group === g.key).map((m) => {
                    const Icon = ICONS[m.slug] ?? LayoutGrid;
                    const href = m.slug === "overview" ? "/console" : `/console/${m.slug}`;
                    const active = pathname === href;
                    return (
                      <Link key={m.slug} href={href} className="c-navitem" data-active={active} title={m.label}>
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        {!collapsed && <span className="truncate">{m.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <button onClick={() => setCollapsed((v) => !v)} className="c-navitem mt-2" title="Toggle sidebar">
            {collapsed ? <PanelLeft className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Floating top bar */}
          <header className="sticky top-0 z-30 px-4 pt-4">
            <div className="c-glass flex items-center gap-3 px-4 py-2.5">
              <button className="c-btn !px-2.5 !py-2 md:hidden" onClick={() => setMenuOpen(true)} aria-label="Menu">
                <PanelLeft className="h-4 w-4" />
              </button>
              <button className="flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors"
                style={{ background: "var(--c-surface)", color: "var(--c-muted)" }}>
                <Search className="h-4 w-4" />
                <span className="text-[13px]">Search assets, exposures, findings…</span>
                <span className="kbd ml-auto !border-0" style={{ background: "var(--c-surface-2)", color: "var(--c-muted)" }}>⌘K</span>
              </button>

              <ThemeMenu theme={theme} setTheme={setTheme} />

              <button className="c-btn !px-2.5 !py-2" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </button>
              <span className="h-8 w-8 rounded-full c-accent-bar" aria-hidden="true" />
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} />
          <aside className="c-glass absolute left-0 top-0 h-dvh w-64 space-y-4 p-4" onClick={(e) => e.stopPropagation()}>
            <p className="px-2 text-[15px] font-medium">Vault<span className="c-grad-text">Ocean</span></p>
            {MODULES.map((m) => {
              const Icon = ICONS[m.slug] ?? LayoutGrid;
              const href = m.slug === "overview" ? "/console" : `/console/${m.slug}`;
              return (
                <Link key={m.slug} href={href} className="c-navitem" data-active={pathname === href} onClick={() => setMenuOpen(false)}>
                  <Icon className="h-[18px] w-[18px]" /> {m.label}
                </Link>
              );
            })}
          </aside>
        </div>
      )}
    </div>
  );
}

function ThemeMenu({ theme, setTheme }: { theme: string; setTheme: (t: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  return (
    <div className="relative">
      <button className="c-btn !px-2.5 !py-2" onClick={() => setOpen((v) => !v)} aria-label="Theme">
        <span className="h-4 w-4 rounded-full" style={{ background: current.swatch }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="c-card absolute right-0 z-50 mt-2 w-52 p-1.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors"
                style={{ color: "var(--c-text)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--c-surface)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span className="h-4 w-4 rounded-full" style={{ background: t.swatch }} />
                {t.label}
                {t.id === theme && <Check className="ml-auto h-3.5 w-3.5" style={{ color: "var(--c-accent)" }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
