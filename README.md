# Vault Ocean

> The open security community. **Learn. Solve. Build. Showcase.**

Vault Ocean (vaultocean.com) is the home site for the security tools you build —
**PentX**, **FILEx**, **CSPy** — and a community platform for ethical hackers.
It fuses the best of GitHub, pwn.college, TryHackMe / HTB, HackerOne and
writeup blogs into **one identity with one streak**: every writeup you read,
flag you crack, and tool PR you merge feeds a single Depth profile.

## The loop

```
Learn  →  Solve  →  Build  →  Showcase  →  (repeat)
writeups   arena    tools     profile
```

## Stack

| Layer       | Choice                          | Why |
|-------------|---------------------------------|-----|
| Framework   | Next.js 16 (App Router) + TS    | SSR for SEO on writeups, scales to the full vision |
| Styling     | Tailwind CSS 3                  | Fast, consistent dark hi-tech design system |
| Icons       | lucide-react                    | Clean, professional, tree-shaken |
| Auth/DB      | Supabase (planned)             | Free tier: Postgres + GitHub OAuth + storage |
| Content      | GitHub repo as CMS (planned)   | Writeups/challenges as Markdown via pull request |
| Hosting      | Cloudflare Pages / Vercel free | ~$0/month to real scale |

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
# production:
npm run build && npm run start
```

Other scripts: `npm run typecheck`, `npm run lint`.

## Project layout

```
src/
├── app/
│   ├── layout.tsx            # root: fonts, nav, footer, metadata
│   ├── page.tsx              # homepage (hero, loop, pillars, arsenal, writeups, profile)
│   ├── writeups/             # list + [slug] detail
│   ├── arena/                # CTF list + demo challenge
│   ├── tools/                # arsenal list + [slug] detail
│   ├── bounties|paths|community/  # roadmap pillars
│   ├── profile/[handle]/     # Depth profile
│   ├── login/                # GitHub OAuth (wired to Supabase)
│   ├── security/             # public security posture + disclosure
│   ├── api/arena/submit/     # server-side flag verification
│   ├── robots.ts, sitemap.ts # SEO
│   └── globals.css           # design system / theme
├── components/               # nav, footer, brand, ui atoms, graph, flag form
└── lib/                      # content seed, cn(), supabase config
```

## What's built (real, not mock)

- Dark hi-tech UI, all six pillar routes, tools showcase, Depth profile.
- **Real database (Prisma + SQLite dev / Postgres prod)** — tools, writeups,
  challenges, users, solves and activity are rows, not hardcoded arrays.
- **Real auth** — email + password (bcrypt), signed httpOnly session cookies (jose).
  Signup / login / logout API routes.
- **Functional Arena** — flags stored only as SHA-256 hashes; solving records a
  `Solve`, awards fathoms, and advances your streak atomically. Re-solves dedupe.
- **Functional writeups** — "mark as read" awards fathoms and feeds the streak.
- **Live profile** — fathoms, rank, streak and the contribution graph are computed
  from your real activity.
- Server-side verification, constant-time compare, rate limiting on every mutation.
- Full security header suite (CSP, HSTS, COOP/CORP, frame-ancestors none).
- SEO (sitemap, robots, OpenGraph), accessible (skip link, focus states, ARIA).

## Database

```bash
npm run db:push     # sync schema to the database
npm run db:seed     # load tools / writeups / challenges
```

Dev uses SQLite (`prisma/dev.db`, zero infra). For production, change `provider`
in `prisma/schema.prisma` to `postgresql` and point `DATABASE_URL` at a free
managed Postgres (Neon / Supabase), then `npm run db:push && npm run db:seed`.

Required env (see `.env`): `DATABASE_URL`, `SESSION_SECRET` (≥32 chars).

## What's next

See [`VAULTOCEAN_PLAN.md`](./VAULTOCEAN_PLAN.md) for the phased roadmap and
[`SECURITY.md`](./SECURITY.md) for the hardening checklist.
