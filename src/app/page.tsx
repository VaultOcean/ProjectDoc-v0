import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight, ArrowUpRight, BookOpen, Flag, PenLine, Wrench, Flame, Zap,
  Target, ShieldAlert, DollarSign, TerminalSquare, Library, Plus, Clock,
  TrendingUp, FileText, Globe,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { ContributionGraph, ContributionLegend } from "@/components/contribution-graph";
import { CveFeed } from "@/components/cve-feed";
import {
  getWriteups,
  getChallengesWithState,
  getSiteStats,
  getLeaderboard,
  getProfileByHandle,
} from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { rankFor, RANKS, rankMeta } from "@/lib/progress";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { canAccessVaultOcean } from "@/lib/vault-ocean";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    // Check if user has VaultOcean access
    const hasVaultOceanAccess = await canAccessVaultOcean();
    if (hasVaultOceanAccess) {
      // User is a VaultOcean admin — show VaultOcean dashboard
      return <Dashboard userId={user.id} handle={user.handle} />;
    }

    // Check if user is a Docx company user
    const docxCompanyUser = await db.companyUser.findFirst({
      where: { userId: user.id },
      include: { company: true },
    });

    if (docxCompanyUser) {
      // Redirect to their Docx company dashboard
      redirect(`/docx/${docxCompanyUser.company.slug}/dashboard`);
    }

    // User has no access to anything
    return <NoAccess />;
  }

  return <Landing />;
}

function NoAccess() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0b0b0e] px-4">
      <div className="max-w-sm text-center">
        <h1 className="text-2xl font-bold text-zinc-100">No Access</h1>
        <p className="mt-2 text-zinc-400">
          You don't have access to any VaultOcean products yet. Please contact your administrator.
        </p>
        <div className="mt-6">
          <Link href="/logout" className="text-sm text-tide hover:underline">
            Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Logged-out: product landing
═══════════════════════════════════════════════════════ */

const MODULES = [
  { label: "Field",    href: "/writeups",  icon: BookOpen, color: "text-tide",    bg: "bg-tide/10",    desc: "Curated bug-bounty writeups and disclosures — real vulnerabilities, distilled to the technique." },
  { label: "Lab",      href: "/arena",     icon: Flag,     color: "text-hop",     bg: "bg-hop/10",     desc: "Hands-on CTF challenges across web, crypto, forensics, pwn. Every solve earns Fathoms." },
  { label: "Arsenal",  href: "/tools",     icon: Wrench,   color: "text-zinc-300",bg: "bg-zinc-700/50",desc: "Open security tools — PentX, FILEx, CSPy. Run them, fork them, ship a PR." },
  { label: "Terminal", href: "/terminal",  icon: TerminalSquare, color: "text-tide", bg: "bg-tide/10", desc: "Browser-based recon shell. DNS, subdomains, CVE lookup, JWT decoder — no install needed." },
];

const EARN_EXAMPLES = [
  { action: "Read a Field report",  earn: "+25ƒ" },
  { action: "Crack a Lab flag",     earn: "+50–200ƒ" },
  { action: "Publish a Draft post", earn: "+50ƒ" },
  { action: "Merge an Arsenal PR",  earn: "+100ƒ" },
];

async function Landing() {
  const [writeups, stats, leaderboard, challenges] = await Promise.all([
    getWriteups(),
    getSiteStats(),
    getLeaderboard(3),
    getChallengesWithState(null),
  ]);
  const latest = writeups.slice(0, 4);
  const featured = writeups[0] ?? null;
  const featuredChallenge = challenges.find((c) => c.active) ?? challenges[0] ?? null;

  return (
    <div className="overflow-clip">

      {/* ── HERO ── */}
      <section className="aurora relative overflow-clip px-5 pb-24 pt-20 sm:px-8 sm:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-tide/20 bg-tide/5 px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest text-tide">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tide" />
              Ethical Hackers OS · est. 2026
            </div>
          </Reveal>
          <Reveal delay={60}>
            <h1 className="display display-hero mx-auto mt-7 max-w-3xl text-ink-primary">
              The operating system for{" "}
              <span className="serif-em grad-tide">ethical hackers.</span>
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-secondary">
              Manage engagements. Write reports. Run recon. Track earnings.
              One workspace — built for serious bug bounty hunters.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/login"
                className="group inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 font-medium text-abyss-900 transition-all duration-200 active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg,#2ee6d6 0%,#4ff5e6 100%)", boxShadow: "0 0 28px rgba(46,230,214,0.4), 0 6px 18px rgba(0,0,0,0.25)" }}>
                Start your descent
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/terminal"
                className="group inline-flex items-center gap-2 rounded-full border border-hair px-6 py-3.5 text-sm font-medium text-ink-secondary transition-all duration-200 hover:border-tide/30 hover:text-tide">
                Try Terminal
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-14 flex flex-wrap items-center justify-center gap-12 border-t border-hair pt-10">
              {[
                { v: stats.tools,    k: "open tools" },
                { v: stats.solves,   k: "flags solved" },
                { v: stats.writeups, k: "writeups" },
              ].map((s) => (
                <div key={s.k} className="text-center">
                  <p className="display text-4xl text-tide">{s.v}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted">{s.k}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── MODULES ── */}
      <section className="border-y border-hair px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="display display-lg max-w-3xl leading-[1.1] text-ink-secondary">Four modules.</p>
            <p className="display display-lg max-w-3xl leading-[1.1] text-ink-primary">One <span className="serif-em grad-tide">depth profile.</span></p>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((m, i) => (
              <Reveal key={m.label} delay={i * 60}>
                <Link href={m.href} className="module-card group flex flex-col gap-4">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", m.bg)}>
                    <m.icon className={cn("h-4 w-4", m.color)} />
                  </div>
                  <div>
                    <p className={cn("font-mono text-xs font-semibold uppercase tracking-widest", m.color)}>{m.label}</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{m.desc}</p>
                  </div>
                  <div className="mt-auto flex items-center gap-1 font-mono text-[11px] text-ink-faint transition-colors group-hover:text-tide">
                    Explore <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPTH SYSTEM ── */}
      <section className="border-y border-hair">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <Reveal>
            <h2 className="display display-lg text-ink-primary">
              One profile. <span className="serif-em grad-tide">Six depths.</span>
            </h2>
            <p className="mt-4 max-w-lg text-ink-secondary">
              Every action earns Fathoms. Your rank advances as you go deeper.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {RANKS.map((r, i) => (
              <Reveal key={r.name} delay={i * 50}>
                <div className="rank-card">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-ink-faint">{String(i + 1).padStart(2, "0")}</p>
                  <p className="display mt-2 text-xl text-ink-primary">{r.name}</p>
                  <p className="mt-3 font-mono text-[10px] text-ink-muted">{r.min === 0 ? "0ƒ to start" : `from ${r.min.toLocaleString()}ƒ`}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={80}>
            <div className="mt-10 flex flex-wrap gap-3">
              {EARN_EXAMPLES.map((e) => (
                <div key={e.action}
                  className="flex items-center gap-2.5 rounded-full border border-hair px-4 py-2 transition-colors hover:border-tide/25"
                  style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 2px 8px rgba(0,0,0,0.25)" }}>
                  <span className="text-sm text-ink-secondary">{e.action}</span>
                  <span className="font-mono text-xs font-semibold text-tide">{e.earn}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── COMMUNITY ── */}
      <section className="border-t border-hair">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="display display-lg text-ink-primary">From the <span className="serif-em text-tide">field.</span></h2>
              <Link href="/arena/leaderboard" className="inline-flex items-center gap-1.5 text-sm text-ink-secondary transition-colors hover:text-tide">
                Full leaderboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.5fr]">
            <Reveal>
              <p className="label-mono mb-5">Top divers</p>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((entry, i) => (
                    <Link key={entry.handle} href={`/profile/${entry.handle}`}
                      className="card card-hover flex items-center gap-4 p-4">
                      <span className="w-5 text-right font-mono text-sm text-ink-faint">{i + 1}</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-abyss-600 font-mono text-[10px] uppercase text-tide">
                        {entry.handle.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-sm text-ink-primary">{entry.handle}</p>
                        <p className="font-mono text-[10px] text-ink-muted">{entry.solves} solves · {entry.streakDays}d streak</p>
                      </div>
                      <span className="font-mono text-sm text-tide">{entry.fathoms.toLocaleString()}ƒ</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="card p-5">
                  <p className="text-sm text-ink-secondary">Be the first to claim a rank.</p>
                  <Link href="/login" className="btn-tide mt-4 inline-flex">Join now <ArrowRight className="h-4 w-4" /></Link>
                </div>
              )}
            </Reveal>
            <Reveal delay={80}>
              <p className="label-mono mb-5">Latest writeups</p>
              <div>
                {latest.map((w) => (
                  <Link key={w.slug} href={`/writeups/${w.slug}`} className="index-row group items-center">
                    <span className="hidden w-20 shrink-0 font-mono text-[10px] uppercase tracking-wider text-sev-high sm:block">{w.severity}</span>
                    <span className="flex-1 font-display text-lg text-ink-primary transition-colors group-hover:text-tide sm:text-xl">{w.title}</span>
                    <span className="font-mono text-[10px] text-ink-faint">{w.readMinutes}m</span>
                  </Link>
                ))}
                {latest.length === 0 && <p className="py-4 text-sm text-ink-muted">Writeups coming soon.</p>}
              </div>
              <Link href="/writeups" className="mt-6 inline-flex items-center gap-1.5 text-sm text-ink-secondary transition-colors hover:text-tide">
                All writeups <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="aurora relative border-t border-hair px-5 py-32 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <h2 className="display display-xl text-ink-primary">Ready to go <span className="serif-em text-tide">under?</span></h2>
            <p className="mx-auto mt-6 max-w-sm text-ink-secondary">Free to join. Start earning Fathoms today.</p>
            <Link href="/login" className="group mt-10 inline-flex items-center gap-2 rounded-full bg-tide px-8 py-4 font-medium text-abyss-900 transition hover:bg-tide-bright">
              Create your profile
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Logged-in: personalized OS dashboard
═══════════════════════════════════════════════════════ */

const SEV_COLOR: Record<string, string> = {
  critical: "border-red-500/40 text-red-400 bg-red-400/5",
  high:     "border-orange-500/40 text-orange-400 bg-orange-400/5",
  medium:   "border-yellow-500/40 text-yellow-400 bg-yellow-400/5",
  low:      "border-blue-500/40 text-blue-400 bg-blue-400/5",
  info:     "border-zinc-600 text-zinc-400 bg-zinc-800/40",
};
const STATUS_DOT: Record<string, string> = {
  draft: "bg-zinc-500", submitted: "bg-yellow-400", triaged: "bg-blue-400",
  resolved: "bg-tide", informative: "bg-zinc-500", duplicate: "bg-zinc-500", "n/a": "bg-zinc-500",
};

const QUICK_ACTIONS = [
  { label: "New Engagement",  href: "/targets",    icon: Plus,           color: "bg-tide/10 text-tide border-tide/20",    desc: "Add target" },
  { label: "Write Report",    href: "/reports/new",icon: FileText,       color: "bg-red-400/10 text-red-400 border-red-400/20", desc: "Bug report" },
  { label: "Terminal",        href: "/terminal",   icon: TerminalSquare, color: "bg-zinc-700/60 text-zinc-300 border-zinc-700", desc: "Recon shell" },
  { label: "Payloads",        href: "/payloads",   icon: Library,        color: "bg-purple-400/10 text-purple-400 border-purple-400/20", desc: "Payload lib" },
  { label: "Programs",        href: "/programs",   icon: Globe,          color: "bg-blue-400/10 text-blue-400 border-blue-400/20", desc: "H1 & Bugcrowd" },
  { label: "Cheatsheets",     href: "/cheatsheets",icon: BookOpen,       color: "bg-orange-400/10 text-orange-400 border-orange-400/20", desc: "Commands" },
];

async function Dashboard({ userId, handle }: { userId: string; handle: string }) {
  const [profile, writeups, challenges, targets, reports, earningsData] = await Promise.all([
    getProfileByHandle(handle),
    getWriteups(),
    getChallengesWithState(userId),
    db.target.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: { id: true, domain: true, name: true, platform: true, status: true, updatedAt: true, _count: { select: { reports: true } } },
    }),
    db.vulnReport.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, severity: true, status: true, platform: true, programName: true, cvssScore: true, createdAt: true },
    }),
    db.bountySubmission.aggregate({
      where: { userId },
      _sum: { bountyUSD: true },
      _count: { id: true },
    }),
  ]);

  if (!profile) return null;

  const { rank, next, nextAt } = rankFor(profile.fathoms);
  const rc = rankMeta(rank);
  const currentRankIdx = RANKS.findIndex((r) => r.name === rank);
  const prevMin = RANKS[currentRankIdx]?.min ?? 0;
  const progress = nextAt != null
    ? Math.min(100, Math.round(((profile.fathoms - prevMin) / (nextAt - prevMin)) * 100))
    : 100;

  const activeTargets   = targets.filter((t) => t.status === "active");
  const totalEarned     = earningsData._sum.bountyUSD ?? 0;
  const totalSubmissions= earningsData._count.id;
  const pendingReports  = reports.filter((r) => r.status === "submitted" || r.status === "triaged").length;
  const nextChallenge   = challenges.find((c) => c.active && !c.solved) ?? challenges.find((c) => c.active);
  const todayWriteup    = writeups[0];

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 sm:py-10">

      {/* ── HEADER ── */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="display display-lg mt-1.5 text-ink-primary">
            {greeting}, <span className="serif-em text-tide">{handle}.</span>
          </h1>
          {pendingReports > 0 && (
            <p className="mt-1.5 font-mono text-[12px] text-yellow-400">
              {pendingReports} report{pendingReports > 1 ? "s" : ""} pending triage
            </p>
          )}
        </div>
        <Link href={`/profile/${handle}`}
          className={cn("hidden items-center gap-3 rounded-full border-2 py-1 pl-1 pr-4 transition-colors sm:flex", rc.ring, "hover:bg-abyss-700/40")}>
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-full font-mono text-xs uppercase", rc.icon)}>
            <span className={rc.text}>{handle.slice(0, 2)}</span>
          </div>
          <div>
            <p className="font-mono text-xs font-medium text-ink-primary">{handle}</p>
            <p className={cn("font-mono text-[10px]", rc.text)}>{rank}</p>
          </div>
        </Link>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="mb-8 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.href + a.label} href={a.href}
            className={cn("flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-all hover:scale-[1.02] hover:shadow-lg", a.color)}>
            <a.icon className="h-5 w-5" />
            <span className="text-[11px] font-semibold leading-tight">{a.label}</span>
            <span className="font-mono text-[9px] opacity-60">{a.desc}</span>
          </Link>
        ))}
      </div>

      {/* ── STATS ROW ── */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Fathoms" value={profile.fathoms.toLocaleString()} icon={<Zap className="h-4 w-4 text-tide" />} iconBg="bg-tide/10" valueClass="text-tide" />
        <StatCard label="Day streak" value={String(profile.streakDays)} icon={<Flame className="h-4 w-4 text-orange-400" />} iconBg="bg-orange-400/10" valueClass="text-orange-400" />
        <StatCard label="Active targets" value={String(activeTargets.length)} icon={<Target className="h-4 w-4 text-emerald-400" />} iconBg="bg-emerald-400/10" valueClass="text-emerald-400" href="/targets" />
        <StatCard label="Total earned" value={`$${totalEarned.toLocaleString()}`} icon={<DollarSign className="h-4 w-4 text-tide" />} iconBg="bg-tide/10" valueClass="text-tide" href="/earnings" highlight />
      </div>

      {/* ── RANK BAR ── */}
      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", rc.bar)} />
            <span className={cn("font-mono text-sm font-medium", rc.text)}>{rank}</span>
            <span className="font-mono text-[10px] text-zinc-500">current rank</span>
          </div>
          {next && (
            <span className="font-mono text-[11px] text-zinc-500">
              {(nextAt! - profile.fathoms).toLocaleString()}ƒ to {next}
            </span>
          )}
        </div>
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-zinc-800">
          <div className={cn("h-full rounded-full transition-all", rc.bar)} style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

        {/* LEFT: Engagements + Reports */}
        <div className="space-y-6">

          {/* Active Engagements */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="label-mono flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-emerald-400" />
                Active Engagements
              </p>
              <Link href="/targets" className="font-mono text-[11px] text-zinc-500 hover:text-tide transition-colors">
                View all <ArrowRight className="inline h-3 w-3" />
              </Link>
            </div>
            {activeTargets.length === 0 ? (
              <Link href="/targets"
                className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-500 hover:border-tide/40 hover:text-tide transition-colors">
                <Plus className="h-4 w-4" />
                Add your first engagement target
              </Link>
            ) : (
              <div className="space-y-2">
                {activeTargets.map((t) => (
                  <Link key={t.id} href={`/targets/${t.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition-all hover:border-zinc-700 hover:bg-zinc-900">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 font-mono text-[11px] font-bold uppercase text-emerald-400">
                      {t.domain.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[13px] font-medium text-zinc-100">{t.domain}</p>
                      <p className="font-mono text-[10px] text-zinc-500">
                        {t.platform || "No platform"} · {t._count.reports} report{t._count.reports !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-zinc-600">
                        {new Date(t.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-700 transition-colors group-hover:text-tide" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent Reports */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="label-mono flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                Recent Reports
              </p>
              <Link href="/reports" className="font-mono text-[11px] text-zinc-500 hover:text-tide transition-colors">
                View all <ArrowRight className="inline h-3 w-3" />
              </Link>
            </div>
            {reports.length === 0 ? (
              <Link href="/reports/new"
                className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-500 hover:border-red-400/40 hover:text-zinc-300 transition-colors">
                <Plus className="h-4 w-4" />
                Write your first vulnerability report
              </Link>
            ) : (
              <div className="space-y-2">
                {reports.map((r) => (
                  <Link key={r.id} href={`/reports/${r.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition-all hover:border-zinc-700 hover:bg-zinc-900">
                    <span className={cn("shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase", SEV_COLOR[r.severity] ?? SEV_COLOR.info)}>
                      {r.severity}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-zinc-100">{r.title}</p>
                      <p className="font-mono text-[10px] text-zinc-500">
                        {r.programName || r.platform || "No program"} · CVSS {r.cvssScore > 0 ? r.cvssScore.toFixed(1) : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[r.status] ?? "bg-zinc-500")} />
                        <span className="font-mono text-[10px] text-zinc-500 capitalize">{r.status}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-700 transition-colors group-hover:text-tide" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Activity heatmap */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="label-mono">Activity · last 52 weeks</p>
              <ContributionLegend />
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <ContributionGraph data={profile.contributions} />
            </div>
          </section>
        </div>

        {/* RIGHT: Earnings + Tools + Community */}
        <div className="space-y-6">

          {/* Earnings snapshot */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="label-mono flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-tide" />
                Earnings
              </p>
              <Link href="/earnings" className="font-mono text-[11px] text-zinc-500 hover:text-tide transition-colors">
                Tracker <ArrowRight className="inline h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-tide/20 bg-tide/5 p-3">
                <p className="font-mono text-[10px] text-zinc-500">Total earned</p>
                <p className="mt-1 font-mono text-xl font-bold text-tide">${totalEarned.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/40 p-3">
                <p className="font-mono text-[10px] text-zinc-500">Submissions</p>
                <p className="mt-1 font-mono text-xl font-bold text-zinc-100">{totalSubmissions}</p>
              </div>
            </div>
            {totalSubmissions === 0 && (
              <Link href="/earnings"
                className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-zinc-700 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Log your first submission
              </Link>
            )}
          </section>

          {/* Today's writeup */}
          {todayWriteup && (
            <section>
              <p className="label-mono mb-3 flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                From the Field
              </p>
              <Link href={`/writeups/${todayWriteup.slug}`}
                className="group block rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-tide/30 hover:bg-zinc-900">
                <p className="text-sm font-medium text-zinc-100 group-hover:text-tide transition-colors line-clamp-2">
                  {todayWriteup.title}
                </p>
                <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-zinc-500">{todayWriteup.summary}</p>
                <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3">
                  <span className="font-mono text-[10px] text-zinc-600">{todayWriteup.readMinutes} min · +25ƒ</span>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-600 transition-colors group-hover:text-tide" />
                </div>
              </Link>
            </section>
          )}

          {/* Next challenge */}
          {nextChallenge && (
            <section>
              <p className="label-mono mb-3 flex items-center gap-2">
                <Flag className="h-3.5 w-3.5 text-hop" />
                Lab Challenge
              </p>
              <Link href={`/arena/${nextChallenge.slug}`}
                className="group block rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-hop/30 hover:bg-zinc-900">
                <p className="text-sm font-medium text-zinc-100 group-hover:text-tide transition-colors">{nextChallenge.title}</p>
                <p className="mt-1 font-mono text-[10px] text-zinc-500">
                  {nextChallenge.difficulty} · {nextChallenge.category} · {nextChallenge.fathoms}ƒ
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3">
                  <span className="font-mono text-[10px] text-zinc-600">{nextChallenge.solves} solvers</span>
                  <span className="font-mono text-[10px] text-hop">+{nextChallenge.fathoms}ƒ on solve</span>
                </div>
              </Link>
            </section>
          )}

          {/* CVE feed */}
          <Reveal delay={40}>
            <CveFeed />
          </Reveal>
        </div>
      </div>

      <p className="mt-8 font-mono text-[11px] text-zinc-600">
        ⌘K to jump anywhere ·{" "}
        <Link href={`/profile/${handle}`} className="text-tide hover:underline">view full profile</Link>
      </p>
    </div>
  );
}

function StatCard({ label, value, icon, iconBg, valueClass, href, highlight }: {
  label: string; value: string; icon: React.ReactNode; iconBg: string;
  valueClass?: string; href?: string; highlight?: boolean;
}) {
  const inner = (
    <div className={cn("flex items-center gap-3 rounded-xl border p-4 transition-colors",
      highlight ? "border-tide/20 bg-tide/5 hover:border-tide/30" : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700",
      href && "cursor-pointer")}>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={cn("font-mono text-xl font-bold leading-none", valueClass ?? "text-zinc-100")}>{value}</p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-zinc-500 truncate">{label}</p>
      </div>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
