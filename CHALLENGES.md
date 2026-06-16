# HackerOcean — how to add a challenge

Every challenge is one entry in `prisma/seed.ts` (the `CHALLENGES` array). You never
touch the database by hand — you edit the list, run the seed, and it appears on the
board. Here is the whole process.

## The shape of a challenge

```ts
{
  slug: "spin-cycle",            // unique url id (a-z, dashes)
  title: "Spin Cycle",
  category: "crypto",            // web | crypto | forensics | reversing | pwn | osint
  difficulty: "easy",           // easy | medium | hard | insane
  fathoms: 50,                   // points awarded on solve
  prompt: "One-line teaser on the card.",
  description: "The full briefing shown on the challenge page.",
  hints: ["First nudge.", "Bigger nudge."],   // revealed one at a time
  files: [{ name: "transmission.txt", url: "/ctf/transmission.txt" }], // downloads (optional)
  kind: "download",              // download | web | static
  active: true,                  // false = shows as "locked / coming soon"
  flag: "VO{rot13_rolls_around}",// the answer — only its SHA-256 is stored
}
```

The **flag is never stored in plaintext** — the seed hashes it (`sha256`) and saves
only the hash. Verification re-hashes the submission and compares in constant time.

## The three kinds (this is the "practical solving" tech)

- **`download`** — you ship a real file in `public/ctf/` and list it in `files`.
  Players download it, work it locally (decode/carve/reverse), and submit. Truly
  practical, $0 to host (the file is static).
- **`web`** — there is a real, intentionally-vulnerable endpoint under
  `src/app/api/ctf/...`. Players actually exploit it (IDOR, etc.) to extract the
  flag. See `ghost-in-the-params` + `src/app/api/ctf/staff/[id]/route.ts` for the
  working example. This is how we give hands-on exploitation for free — the target
  runs as a serverless function, no per-user VM needed.
- **`static`** — pure knowledge/recall (e.g. "name the missing cookie attribute").

> Full attack-box VMs (a whole Linux machine like HTB) need paid per-user sandboxes
> and are deliberately deferred. `web` + `download` cover web/crypto/forensics/rev/
> osint practically, today, for nothing.

## Add one — step by step

1. **(download/web only)** create the artifact or endpoint:
   - download: add the file to `public/ctf/yourfile.ext` (or generate it in a script).
   - web: add a route under `src/app/api/ctf/<name>/route.ts` that is solvable.
2. **Add the entry** to the `CHALLENGES` array in `prisma/seed.ts`.
3. **Re-seed** (writes/updates rows; safe to run repeatedly — it upserts by slug):
   ```bash
   npm run db:seed         # uses DATABASE_URL from .env.local (Neon)
   ```
4. **Deploy** (or it's already live if seeding prod): `vercel deploy --prod`.

That's it — it shows up on `/arena`, grouped by category, with difficulty, points,
solve count, hints, downloads, and a flag box wired to the scoreboard + streak.

## Roadmap for richer challenges
- An in-app admin form to add challenges without editing code.
- Per-user containers for real pwn/boot2root boxes (needs funded infra).
- First-blood bonuses and time-decay scoring.
