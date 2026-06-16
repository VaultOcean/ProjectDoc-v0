# Vault Ocean — re-architecture plan (PAUSED · resume on command)

Status: **paused** at user request. No deploys (no Vercel token available right now).
Resume = user says "resume". Then execute phase-by-phase, build + local preview to
verify UX, deploy to prod only once a fresh Vercel token is provided (revoke after).

---

## Login / auth flow — findings (reviewed `src/lib/auth.ts`, `api/auth/*`, `auth-form.tsx`)

Works today: email+password, bcrypt(12), jose HS256 JWT in httpOnly cookie (7d,
SameSite=lax, Secure in prod), dummy-compare on login to resist user-enumeration
timing, IP rate-limiting on login/signup.

Gaps to fix (folded into the phases below):
1. No email verification → anyone registers as any email (impersonation/spam).
2. No forgot/reset password → permanent lockout. (critical basic)
3. No GitHub OAuth (promised, not built).
4. Session: fixed 7d, no sliding refresh, no "sign out everywhere"/revoke.
   Harden cookie: `__Host-` prefix, consider SameSite=strict for auth routes.
5. No explicit CSRF token (leans on SameSite=lax) — add when settings forms land.
6. No onboarding after signup (lands on empty profile = dead end).
7. Weak error UX: single error string, no inline field errors, no show-password,
   no remember-me, no password strength/breach check.
8. Signup reveals whether an email/handle is taken (enumeration) — accepted tradeoff.

---

## Phase 1 — Public/app split + app shell + login gate + onboarding (the flow fix)

Root cause of "poor flow": no separation of public vs. logged-in app; everything is
flat top-nav and shown pre-login.

- **Route groups**: `src/app/(public)/...` and `src/app/(app)/...` with separate layouts.
- **Public zone (no login)**: `/` = clean landing (value pitch + Sign up/in ONLY —
  remove the Read/Solve/Build doors from pre-login). Keep `/writeups` publicly
  readable for discovery/SEO. Everything else gated.
- **`middleware.ts`**: gate `/dashboard`, `/arena*`, `/write*`, `/settings`,
  `/profile/edit` → redirect to `/login` when no valid session.
- **App shell**: persistent left **sidebar** layout for the `(app)` group
  (Dashboard · HackerOcean · Write · Tools · Profile · Settings), collapsible on mobile.
- **`/dashboard`**: move the daily panel here (streak, today's writeup + challenge).
- **Onboarding**: after signup → `/welcome` (display name, avatar, pick interests)
  → then dashboard.
- Add loading / empty / toast states; consistent spacing & hierarchy.

Outcome: pre-login = focused landing; post-login = a real app with stable nav.

## Phase 2 — Auth hardening + account & profile management

- **GitHub OAuth** ("Sign in with GitHub") via a GitHub OAuth app.
- **Email verification** (send link) + **forgot/reset password** (token email).
  Email sending: Resend free tier (or similar). Needs a sender domain on vaultocean.com.
- **`/settings`**: change display name, bio, **avatar upload** (Cloudflare R2 free),
  change password, change email, sign-out-everywhere, delete account.
- **Profile**: edit own profile; avatar; tabs for "your posts" / "your solves".
- **Session hardening**: `__Host-` cookie, optional sliding refresh, revoke list.

## Phase 3 — Notion / Medium writer (the writing pillar)

- **Rich editor**: Tiptap (Notion-style blocks) or MDX-based. Autosave **drafts**,
  cover image (R2), tags, publish flow, optional moderation/approve.
- **Schema**: `Post { author, title, slug, bodyJson, status(draft|published),
  cover, tags, readMinutes, createdAt }`.
- **Personal blog space** at `/u/[handle]`; author attribution; edit own posts.
- Public reading view (feeds the public `/writeups` discovery zone).

---

## Capacity / infra notes (answered)
- Storage (Neon free 0.5 GB): ~100k–300k accounts before pressure — not the limit.
- Concurrency ceiling = Neon free compute (~50–150 concurrent active users comfortably).
- Scale path: Neon paid (~$19/mo) + optional Vercel Pro (~$20/mo) → thousands concurrent.
- Avatars/covers storage → Cloudflare R2 free tier (set up in Phase 2).

## Deploy discipline
- No deploy without a fresh, short-lived Vercel token from the user.
- Revoke the token after each deploy session. Roll the earlier Cloudflare token too.
