import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Flame } from "lucide-react";
import { getLeaderboard } from "@/lib/queries";
import { rankFor } from "@/lib/progress";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Leaderboard — Vault Ocean",
  description: "The deepest divers on Vault Ocean, ranked by fathoms.",
};

export default async function LeaderboardPage() {
  const board = await getLeaderboard(50);

  return (
    <div className="py-12 sm:py-16">
      <Link href="/arena" className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted hover:text-hop">
        <ArrowLeft className="h-3.5 w-3.5" /> Lab
      </Link>

      <div className="mt-6">
        <p className="overline text-hop">Leaderboard</p>
        <h1 className="display display-lg mt-4 text-ink-primary">
          The deepest <span className="serif-em text-hop">divers.</span>
        </h1>
        <p className="mt-5 max-w-xl leading-relaxed text-ink-secondary">
          Ranked by fathoms — earned only from real solves and reviewed work.
        </p>
      </div>

      {board.length === 0 ? (
        <p className="mt-10 font-mono text-sm text-ink-muted">No divers yet. Be the first — go solve something.</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-hair">
          <table className="w-full text-left text-sm">
            <thead className="bg-abyss-800 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-5 py-3 font-normal">#</th>
                <th className="px-5 py-3 font-normal">Diver</th>
                <th className="px-5 py-3 font-normal">Rank</th>
                <th className="hidden px-5 py-3 font-normal sm:table-cell">Solves</th>
                <th className="hidden px-5 py-3 font-normal sm:table-cell">Streak</th>
                <th className="px-5 py-3 text-right font-normal">Fathoms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {board.map((u) => {
                const { rank } = rankFor(u.fathoms);
                return (
                  <tr key={u.handle} className="bg-abyss-700/40 transition-colors hover:bg-abyss-600/50">
                    <td className={cn("px-5 py-3 font-mono", u.rank <= 3 ? "text-hop" : "text-ink-muted")}>
                      {String(u.rank).padStart(2, "0")}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/profile/${u.handle}`} className="font-medium text-ink-primary hover:text-hop">
                        {u.displayName}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-ink-secondary">{rank}</td>
                    <td className="hidden px-5 py-3 font-mono text-xs text-ink-secondary sm:table-cell">{u.solves}</td>
                    <td className="hidden px-5 py-3 font-mono text-xs text-sev-high sm:table-cell">
                      <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" /> {u.streakDays}d</span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-hop">{u.fathoms.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
