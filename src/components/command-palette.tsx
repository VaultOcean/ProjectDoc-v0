"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Flag, Wrench, User, Shield, LogIn, LogOut, ArrowUpRight, Search, Trophy, PenLine, Radar, Target, ShieldAlert, Library, DollarSign, Globe } from "lucide-react";

type Item = {
  label: string;
  hint: string;
  keywords: string;
  icon: typeof BookOpen;
  href?: string;
  external?: boolean;
  action?: "logout";
};

export function CommandPalette({ handle, loggedIn }: { handle: string | null; loggedIn: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => {
    const base: Item[] = [
      { label: "Field — writeups", hint: "field reports", keywords: "field writeups articles learn bugs read reports", icon: BookOpen, href: "/writeups" },
      { label: "Lab — challenges", hint: "ctf challenges", keywords: "lab arena ctf challenge flag fathoms solve", icon: Flag, href: "/arena" },
      { label: "Leaderboard", hint: "top divers", keywords: "leaderboard rank top scoreboard divers", icon: Trophy, href: "/arena/leaderboard" },
      { label: "Posts — community", hint: "community posts", keywords: "posts community feed publish research article", icon: PenLine, href: "/posts" },
      { label: "Write a post", hint: "publish research", keywords: "write new post publish article research community", icon: PenLine, href: "/posts/new" },
      { label: "Search", hint: "find anything", keywords: "search find writeups challenges users docs", icon: Search, href: "/search" },
      { label: "Draft — editor", hint: "notes & docs", keywords: "draft workspace blog notes docs write editor", icon: PenLine, href: "/workspace" },
      { label: "Arsenal — tools", hint: "open tools", keywords: "arsenal tools pentx filex cspy recon subdomain", icon: Wrench, href: "/tools" },
      { label: "Terminal", hint: "security shell", keywords: "terminal shell recon dns ip hash encode jwt wayback cve scan", icon: Wrench, href: "/terminal" },
      { label: "Targets", hint: "recon workspace", keywords: "targets recon workspace domain scope engagement tracking", icon: Target, href: "/targets" },
      { label: "New Target", hint: "add target", keywords: "new target add domain recon engagement", icon: Target, href: "/targets" },
      { label: "Vuln Reports", hint: "bug reports", keywords: "reports vulnerability bug bounty cvss write report", icon: ShieldAlert, href: "/reports" },
      { label: "New Vuln Report", hint: "write bug report", keywords: "new report vulnerability write cvss xss sqli rce", icon: ShieldAlert, href: "/reports/new" },
      { label: "Payload Library", hint: "xss sqli ssrf payloads", keywords: "payloads xss sqli ssrf idor lfi ssti rce csrf xxe nosql jwt open-redirect", icon: Library, href: "/payloads" },
      { label: "Cheatsheets", hint: "nmap ffuf sqlmap commands", keywords: "cheatsheets nmap ffuf sqlmap nuclei gobuster hydra hashcat metasploit burp", icon: Library, href: "/cheatsheets" },
      { label: "Bug Bounty Programs", hint: "H1 & Bugcrowd programs", keywords: "programs bug bounty hackerone bugcrowd intigriti scope", icon: Globe, href: "/programs" },
      { label: "Earnings Tracker", hint: "track bounties", keywords: "earnings bounty tracker money income submissions", icon: DollarSign, href: "/earnings" },
      { label: "Console — scanner", hint: "security scan", keywords: "console scan security headers csp pentx enterprise", icon: Radar, href: "/console" },
      { label: "PentX", hint: "recon scanner", keywords: "pentx recon scan bug bounty", icon: ArrowUpRight, href: "https://pentx.vaultocean.com", external: true },
      { label: "Security", hint: "our posture", keywords: "security disclosure headers", icon: Shield, href: "/security" },
    ];
    if (loggedIn && handle) {
      base.push({ label: "Your profile", hint: "depth & streak", keywords: "profile me streak fathoms depth", icon: User, href: `/profile/${handle}` });
      base.push({ label: "Your blog", hint: "public posts", keywords: "blog posts public writing published", icon: BookOpen, href: `/u/${handle}` });
      base.push({ label: "Sign out", hint: "end session", keywords: "sign out logout leave", icon: LogOut, action: "logout" });
    } else {
      base.push({ label: "Sign in", hint: "create your profile", keywords: "sign in login register account", icon: LogIn, href: "/login" });
    }
    return base;
  }, [handle, loggedIn]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((i) => (i.label + " " + i.keywords).toLowerCase().includes(term));
  }, [q, items]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("vo:open-palette", onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("vo:open-palette", onOpen as EventListener);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  async function run(item: Item) {
    setOpen(false);
    if (item.action === "logout") {
      await fetch("/api/auth/logout", { method: "POST" });
      router.refresh();
      router.push("/");
      return;
    }
    if (!item.href) return;
    if (item.external) {
      window.open(item.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(item.href);
    }
  }

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[active];
      if (item) run(item);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-abyss-900/70 px-4 pt-[14vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-hover bg-abyss-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-hair px-4">
          <Search className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onListKey}
            placeholder="Jump to… (read, solve, build, profile)"
            className="w-full bg-transparent py-4 font-mono text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none"
            aria-label="Search commands"
          />
          <span className="kbd shrink-0">esc</span>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center font-mono text-xs text-ink-muted">no matches</li>
          )}
          {filtered.map((item, i) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => run(item)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  i === active ? "bg-abyss-600 text-tide" : "text-ink-secondary hover:bg-abyss-700"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium text-ink-primary">{item.label}</span>
                <span className="ml-auto font-mono text-[11px] text-ink-muted">{item.hint}</span>
                {item.external && <ArrowUpRight className="h-3.5 w-3.5 text-ink-faint" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
