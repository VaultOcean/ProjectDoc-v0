# Deploying Vault Ocean (free tier)

This app is a Next.js app backed by PostgreSQL. The recommended free setup is
**Vercel** (hosting) + **Neon** (Postgres). Everything below stays on free tiers.

## 1. Generate secrets

Run these locally and keep the output:

```bash
openssl rand -base64 48   # SESSION_SECRET
openssl rand -base64 48   # ENCRYPTION_KEY
```

`ENCRYPTION_KEY` must stay **stable** — changing it makes previously
encrypted field values unreadable.

## 2. Create a free Postgres (Neon)

1. Sign up at https://neon.tech and create a project.
2. Copy the connection string (looks like
   `postgresql://user:pass@host/db?sslmode=require`).
3. Neon also gives a non-pooled URL — keep it for migrations.

## 3. Push the schema

With `DATABASE_URL` pointing at the new database:

```bash
npx prisma migrate deploy     # apply existing migrations
# or, first time from the schema:
npx prisma db push
```

## 4. Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at https://vercel.com → New Project.
3. Add Environment Variables (Production):
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `ENCRYPTION_KEY`
   - `NEXT_PUBLIC_SITE_URL` = your deployed URL (e.g. https://vaultocean.com)
   - *(optional)* `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
4. Deploy. The build runs `prisma generate && next build`.

## 5. Switching to your own database later (Oracle / local Postgres)

The app reads the database from **one env var**. To move to a different DB:

1. Stand up the database and get its connection URL.
2. **Postgres anywhere** (your own server, RDS, etc.): just set `DATABASE_URL`
   to the new URL and run `npx prisma migrate deploy`. No code changes.
3. **Oracle / MySQL / other engine**: change `provider` in
   `prisma/schema.prisma` to the target (`oracle` support is via Prisma; MySQL
   is built in), set `DATABASE_URL`, then `npx prisma migrate dev` to regenerate
   migrations for that engine. Some column types may need review — open an
   issue/ask and it's a small, contained change.

That's the whole seam: **swap the URL (+ provider for non-Postgres), run one
migrate command.** Nothing else in the app hardcodes the database.

## Security checklist (already in place)

- Session cookies are `httpOnly`, `secure` in prod, `sameSite=lax`, signed (JWT).
- Passwords hashed with bcrypt (cost 12); login uses a constant-time dummy hash
  to prevent user enumeration.
- Rate limiting on login, signup, and uploads (Upstash in prod, in-memory dev).
- Upload validation: type allowlist (PDF/images) + 25MB cap.
- Strict security headers + CSP (`next.config.mjs`): no external scripts,
  `frame-ancestors none`, HSTS, `X-Content-Type-Options nosniff`.
- `ENCRYPTION_KEY` is mandatory in production (the app refuses the insecure
  dev fallback when `NODE_ENV=production`).

## Note on uploaded files

PDFs are currently stored in the database (base64). Fine for low/moderate
volume on the free tier. If volume grows, move file bytes to object storage
(S3-compatible) — the read path is isolated to the document routes, so this is
a contained change when you need it.
