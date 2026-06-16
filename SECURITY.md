# Vault Ocean — security posture & hardening checklist

> No system is unbreakable. The goal is defense-in-depth: make attacks expensive,
> contain blast radius, and fail safe. This file is the living checklist.

## Threat model (who we defend against)

- **Anonymous internet** — automated scanners, bots, DoS.
- **Authenticated abusers** — logged-in users trying IDOR, privilege escalation,
  flag brute force, content injection.
- **Skilled adversaries** — XSS/CSRF chains, SSRF via our own tooling, supply-chain.

We assume attackers read this repo (it is open source). Security must not depend
on secrecy of the code — only on secrecy of keys and soundness of design.

## Done (Phase 0)

- [x] **Strict CSP** — `default-src 'self'`, `object-src 'none'`,
      `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`,
      `upgrade-insecure-requests`. (`next.config.mjs`)
- [x] **Security headers** — HSTS (preload), `X-Content-Type-Options: nosniff`,
      `X-Frame-Options: DENY`, `Referrer-Policy`, restrictive `Permissions-Policy`,
      `Cross-Origin-Opener-Policy` + `Cross-Origin-Resource-Policy`.
- [x] **`X-Powered-By` removed** (no framework fingerprinting).
- [x] **Server-side authorization** — flags verified on the server; the answer
      never reaches the browser.
- [x] **Constant-time comparison** — flag check hashes both sides and uses
      `crypto.timingSafeEqual` (no timing oracle, no length leak).
- [x] **Input validation** — strict type checks, length caps, allow-list of
      known challenge slugs before any work; malformed JSON rejected.
- [x] **Rate limiting** — per IP+challenge sliding window on flag submission.
- [x] **Patched dependencies** — Next.js pinned to the current patched line;
      `npm audit` clean on production deps.
- [x] **Accessibility = security** — skip link, visible focus, semantic HTML.

## Before public launch (Phase 1+)

- [ ] **CSP nonces** — replace `'unsafe-inline'` for scripts with per-request
      nonces (Next supports this); tighten `style-src`.
- [ ] **Distributed rate limiting** — move the in-memory limiter to a shared
      store (Upstash Redis / Supabase) so it survives multiple instances.
- [ ] **Auth** — GitHub OAuth via Supabase; httpOnly + Secure + SameSite cookies;
      rotate sessions on privilege change.
- [ ] **Row-Level Security** — every Supabase table gets RLS policies; the anon
      key can only do what an anonymous user should.
- [ ] **CSRF** — SameSite=strict cookies + per-form tokens on state-changing routes.
- [ ] **Output encoding** — all user/markdown content rendered through a vetted
      sanitizer (e.g. rehype-sanitize); never `dangerouslySetInnerHTML` on raw input.
- [ ] **SSRF guardrails** — tools like PentX make outbound requests; isolate them,
      block link-local/metadata ranges (169.254.0.0/16, etc.), use an allow-list.
- [ ] **Secrets** — only in env / a secrets manager; never in the repo;
      service-role key server-only.
- [ ] **Dependency automation** — Dependabot + `npm audit` in CI; lockfile committed.
- [ ] **security.txt** — publish `/.well-known/security.txt` with the disclosure contact.
- [ ] **Logging & monitoring** — structured logs, alert on 429/auth-failure spikes.
- [ ] **WAF / edge** — Cloudflare in front for L7 DoS protection and bot management.

## Responsible disclosure

Found a vulnerability? Email **security@vaultocean.com** before disclosing
publicly. We acknowledge, fix, and credit — and the report earns fathoms.
