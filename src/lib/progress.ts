import { db } from "@/lib/db";

function startOfUtcDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Record an activity, award fathoms, and advance the streak — atomically.
 * Streak rules: same day = unchanged, consecutive day = +1, gap = reset to 1.
 */
export async function awardActivity(
  userId: string,
  kind: "read" | "solve" | "publish" | "contribute",
  fathoms: number,
  ref?: string
) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const today = startOfUtcDay(new Date());
    let streak = user.streakDays;

    if (!user.lastActiveOn) {
      streak = 1;
    } else {
      const last = startOfUtcDay(user.lastActiveOn);
      const dayMs = 86_400_000;
      const diff = Math.round((today - last) / dayMs);
      if (diff === 0) {
        streak = Math.max(streak, 1);
      } else if (diff === 1) {
        streak = streak + 1;
      } else {
        streak = 1;
      }
    }

    await tx.activity.create({ data: { userId, kind, fathoms, ref } });

    return tx.user.update({
      where: { id: userId },
      data: {
        fathoms: { increment: fathoms },
        streakDays: streak,
        lastActiveOn: new Date(),
      },
    });
  });
}

export const RANKS = [
  { name: "Surface", min: 0 },
  { name: "Shallows", min: 250 },
  { name: "Twilight", min: 750 },
  { name: "Midnight", min: 1500 },
  { name: "Abyssal", min: 3000 },
  { name: "Hadal", min: 6000 },
];

export const RANK_META = {
  Surface:  { text: "text-slate-400",   ring: "border-slate-400/50",   bar: "bg-slate-400",   icon: "bg-slate-400/10"   },
  Shallows: { text: "text-tide",        ring: "border-tide/60",        bar: "bg-tide",        icon: "bg-tide/10"        },
  Twilight: { text: "text-blue-400",    ring: "border-blue-400/50",    bar: "bg-blue-400",    icon: "bg-blue-400/10"    },
  Midnight: { text: "text-indigo-400",  ring: "border-indigo-400/50",  bar: "bg-indigo-400",  icon: "bg-indigo-400/10"  },
  Abyssal:  { text: "text-purple-400",  ring: "border-purple-400/50",  bar: "bg-purple-400",  icon: "bg-purple-400/10"  },
  Hadal:    { text: "text-orange-400",  ring: "border-orange-400/50",  bar: "bg-orange-400",  icon: "bg-orange-400/10"  },
} as const;

export function rankMeta(rank: string) {
  return RANK_META[rank as keyof typeof RANK_META] ?? RANK_META.Surface;
}

export function rankFor(fathoms: number) {
  let current = RANKS[0];
  for (const r of RANKS) if (fathoms >= r.min) current = r;
  const next = RANKS.find((r) => r.min > fathoms);
  return { rank: current.name, next: next?.name ?? null, nextAt: next?.min ?? null };
}
