# Vault Ocean — product & build plan

## Thesis

> An open security community where you **learn by reading** curated writeups,
> **prove it by solving** challenges, and **build by contributing** to real tools —
> all tracked on one **Depth profile** with a single streak.

The tools (PentX, FILEx, CSPy) are the gravity. No other community ships its own
arsenal. Everything orbits that.

## What NOT to build (the budget discipline)

Do **not** build live attack-box VMs (the THM/HTB/pwn.college model). That is the
single most expensive piece — per-minute compute, abuse surface, ops burden. Link
out for that. Vault Ocean owns the cheap-but-defensible layer: content, community,
tools, identity. The Arena stays **jeopardy-style** (no VMs) until there is money.

## The six pillars

| Pillar     | What it is | Phase |
|------------|-----------|-------|
| Writeups   | Curated daily bug-bounty TL;DRs + full disclosures | 1 |
| Arena      | Jeopardy CTF, server-checked flags, fathoms | 1 |
| Tools      | PentX / FILEx / CSPy — run, read, contribute | 0 (live) |
| Bounties   | Program board + hall-of-fame feed | 3 |
| Paths      | Structured dojos sequencing the above | 3 |
| Community  | Discussion + reputation from merged work | 2 |

## The Depth engine (the novel bit)

One identity. Every qualifying action keeps the **streak** alive and awards
**fathoms** (XP); fathoms map to a **rank** (Surface → Shallows → Twilight →
Midnight → Abyssal → Hadal).

| Action | Streak | Fathoms |
|--------|:------:|--------:|
| Read + check off a daily writeup | yes | small |
| Solve a CTF challenge | yes | medium |
| Publish a writeup (merged PR) | yes | large |
| Merge a tool PR / valid tool bug report | yes | large |

Reputation comes only from **reviewed, real** work — never vanity clicks.

## Roadmap

- **Phase 0 — Foundation (DONE):** dark hi-tech site, all routes, tools showcase,
  Depth profile UI, server-side flag API, security hardening, SEO. Runnable + tested.
- **Phase 1 — Content + identity:** GitHub OAuth (Supabase), writeups-as-CMS from a
  GitHub repo, "mark as read" → streak, real Arena solves → fathoms.
- **Phase 2 — Community:** discussion, contribution review, reputation.
- **Phase 3 — Bounties + Paths:** program board, structured tracks.
- **Phase 4 — Open contribution at scale:** community submits writeups/challenges/PRs;
  moderation tooling.

## Data model (Supabase / Postgres — Phase 1)

```sql
-- Identity is delegated to GitHub via Supabase Auth; profiles extend auth.users.
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        text unique not null,
  display_name  text not null,
  bio           text,
  fathoms       integer not null default 0,
  streak_days   integer not null default 0,
  last_active   date,
  created_at    timestamptz not null default now()
);

-- Append-only activity log; the contribution graph + streak derive from this.
create table activity (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references profiles(id) on delete cascade,
  kind       text not null check (kind in ('read','solve','publish','contribute')),
  ref        text,                 -- writeup slug / challenge slug / PR url
  fathoms    integer not null default 0,
  created_at timestamptz not null default now()
);
create index on activity (user_id, created_at);

create table challenge_solves (
  user_id      uuid not null references profiles(id) on delete cascade,
  challenge    text not null,
  solved_at    timestamptz not null default now(),
  primary key (user_id, challenge)
);

-- RLS: a user reads everyone's public profile, writes only their own rows.
alter table profiles enable row level security;
alter table activity enable row level security;
alter table challenge_solves enable row level security;

create policy "profiles are public" on profiles for select using (true);
create policy "own profile write"  on profiles for update using (auth.uid() = id);
create policy "own activity read"  on activity  for select using (auth.uid() = user_id);
create policy "own solves"         on challenge_solves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

> Fathom awards and solve records are written by **server-side** code using the
> service-role key after verification — never trusted from the client.

## Writeups-as-CMS (Phase 1, ~$0)

1. Public repo `vaultocean/content` holds `writeups/*.md` with frontmatter
   (title, severity, category, author, date, readMinutes).
2. Contributors open a **pull request**; review = moderation; merge = published.
3. The site fetches Markdown at build time (or via ISR) and renders it through a
   sanitizer. Version history, attribution, and reputation come for free from git.

## Hosting (free tier)

- Frontend: **Cloudflare Pages** or **Vercel** (free).
- Backend: **Supabase** free (Postgres + Auth + Storage + Realtime).
- Tools: keep on their current hosts; Vault Ocean links live demos + repos.
- Edge protection: **Cloudflare** in front (free L7 DoS + bot mitigation).

Estimated cost to real scale: **~$0–5/month** + the domain you already own.

## Open decisions

- Replace the in-memory rate limiter with Upstash/Supabase before multi-instance.
- Choose a Markdown pipeline (`next-mdx-remote` + `rehype-sanitize` recommended).
- Decide leaderboard scope (global vs. per-path) before Community ships.
