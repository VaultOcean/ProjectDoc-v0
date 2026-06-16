import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const db = new PrismaClient();
const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

const TOOLS = [
  { slug: "pentx", name: "PentX", summary: "Evidence-grade bug-bounty recon & scanning.",
    detail: "Passive recon through active testing — every finding ships with full request/response bytes, reflection offsets, a cURL repro, and OAST callbacks for blind classes.",
    language: "Node.js", repo: "https://github.com/0x595/pentx", status: "live", tags: "recon,scanning,bug-bounty,oast", sort: 0 },
  { slug: "filex", name: "FILEx", summary: "On-premise PDF processing toolkit.",
    detail: "A self-hosted document toolkit — convert, merge, split and process PDFs without sending a byte to a third party. Built for teams that cannot leak documents.",
    language: "Python · FastAPI", repo: "https://github.com/vaultocean/filex", status: "beta", tags: "pdf,self-hosted,privacy,documents", sort: 1 },
  { slug: "cspy", name: "CSPy", summary: "Content-Security-Policy inspector extension.",
    detail: "A browser extension that audits the CSP and security headers of any site you visit and explains, in plain language, what an attacker could do with the gaps.",
    language: "TypeScript", repo: "https://github.com/vaultocean/cspy", status: "alpha", tags: "csp,headers,browser,audit", sort: 2 },
];

const WRITEUPS = [
  { slug: "idor-account-takeover-via-sequential-uuid", title: "IDOR to full account takeover via predictable UUIDv1",
    summary: "Time-based UUIDs leaked creation order; enumerating them exposed password-reset tokens for any user.",
    category: "Access Control", severity: "critical", author: "anon", readMinutes: 4, date: "2026-06-12",
    body: "UUIDv1 encodes a timestamp and node id, so tokens issued close together are highly predictable. By harvesting a few reset tokens and interpolating, an attacker could mint a valid token for any account. Fix: use UUIDv4 (CSPRNG) for anything security-sensitive, and bind reset tokens to the user + a server-side secret." },
  { slug: "blind-ssrf-cloud-metadata", title: "Blind SSRF reaching cloud metadata through a PDF renderer",
    summary: "A server-side HTML-to-PDF feature followed redirects to 169.254.169.254 and embedded IAM creds in the output.",
    category: "SSRF", severity: "high", author: "anon", readMinutes: 6, date: "2026-06-11",
    body: "The renderer fetched remote resources without an allow-list and followed redirects. A crafted document pointed at the link-local metadata endpoint, and the temporary IAM credentials landed in the rendered PDF. Fix: block link-local/metadata ranges, disable redirects, require IMDSv2." },
  { slug: "stored-xss-markdown-image-onerror", title: "Stored XSS via Markdown image onerror in a comment field",
    summary: "The sanitizer allowed img tags but not their attributes — except onerror slipped through a parser quirk.",
    category: "XSS", severity: "high", author: "anon", readMinutes: 3, date: "2026-06-10",
    body: "A permissive Markdown-to-HTML step ran before sanitization, and a parser edge case let an onerror handler survive. Fix: sanitize the final HTML with a strict allow-list (rehype-sanitize), never trust attribute filtering by denylist." },
  { slug: "jwt-alg-confusion-rs256-to-hs256", title: "JWT alg confusion: forging tokens by switching RS256 to HS256",
    summary: "The public key, served at a well-known endpoint, was accepted as an HMAC secret when the alg header was changed.",
    category: "Authentication", severity: "critical", author: "anon", readMinutes: 5, date: "2026-06-09",
    body: "The verifier trusted the token's own alg header. Switching RS256→HS256 and signing with the public key produced a token the server accepted. Fix: pin the expected algorithm server-side; never let the token choose." },
];

type Ch = {
  slug: string; title: string; category: string; difficulty: string; fathoms: number;
  prompt: string; description: string; hints: string[]; files: { name: string; url: string }[];
  kind: "download" | "web" | "static"; active: boolean; flag: string;
};

const CHALLENGES: Ch[] = [
  {
    slug: "leaky-cookie", title: "Leaky Cookie", category: "web", difficulty: "easy", fathoms: 50,
    prompt: "A session cookie is missing the flag that stops JavaScript from reading it.",
    description: "The login sets a session cookie without one critical attribute — the one that keeps document.cookie (and therefore any XSS) from reading it. Name that missing attribute inside the flag wrapper.",
    hints: ["It is one word.", "Think about what stops client-side JS from seeing a cookie."],
    files: [], kind: "static", active: true, flag: "VO{c00kies_should_be_httponly}",
  },
  {
    slug: "spin-cycle", title: "Spin Cycle", category: "crypto", difficulty: "easy", fathoms: 50,
    prompt: "An intercepted note has been rotated. Spin it back.",
    description: "Download the transmission and rotate it back to plaintext. The cipher is as old as Caesar and rolls exactly halfway around the alphabet.",
    hints: ["Each letter is shifted by 13.", "ROT13 is its own inverse."],
    files: [{ name: "transmission.txt", url: "/ctf/transmission.txt" }], kind: "download", active: true, flag: "VO{rot13_rolls_around}",
  },
  {
    slug: "intercepted", title: "Intercepted", category: "crypto", difficulty: "easy", fathoms: 75,
    prompt: "A transmission was captured, but it is only encoded — not encrypted.",
    description: "We intercepted a blob of text that looks scrambled but isn't actually secret. Decode it and read the flag straight out.",
    hints: ["Those = signs at the end are a giveaway.", "base64 -d"],
    files: [{ name: "intercepted.txt", url: "/ctf/intercepted.txt" }], kind: "download", active: true, flag: "VO{base64_is_only_encoding}",
  },
  {
    slug: "evidence-dump", title: "Evidence Dump", category: "forensics", difficulty: "easy", fathoms: 75,
    prompt: "A raw hex dump was pulled from disk. Carve the flag out.",
    description: "Forensics pulled a hex dump off a wiped drive. Convert the hex back to bytes and the flag is sitting in plain ASCII.",
    hints: ["Two hex chars = one byte.", "xxd -r -p, or any hex-to-ASCII tool."],
    files: [{ name: "evidence.hex", url: "/ctf/evidence.hex" }], kind: "download", active: true, flag: "VO{hex_dump_decoded}",
  },
  {
    slug: "ghost-in-the-params", title: "Ghost in the Params", category: "web", difficulty: "medium", fathoms: 150,
    prompt: "The staff API hands out records by id with no authorization. Climb to the top.",
    description: "HackerOcean's staff directory is served live at /api/ctf/staff/{id}. Your recruit id is 1337 — try it. Then realize nothing stops you from asking for other ids. The founder is id 1, and they left something in their record they shouldn't have. This endpoint is genuinely live and genuinely vulnerable — exploit it to get the flag.",
    hints: ["Open /api/ctf/staff/1337 first to see the shape.", "It is an IDOR — change the id.", "The founder is id 1."],
    files: [], kind: "web", active: true, flag: "VO{idor_climbs_to_id_one}",
  },
  {
    slug: "rsa-twins", title: "RSA Twins", category: "crypto", difficulty: "hard", fathoms: 250,
    prompt: "Two moduli, one shared prime. Factor them both.",
    description: "Coming soon — an advanced challenge: two RSA public keys were generated carelessly and share a prime factor. A single GCD breaks both. Full artifact lands shortly.",
    hints: ["gcd(n1, n2) is not 1."], files: [], kind: "download", active: false, flag: "VO{shared_prime_factors_rsa}",
  },
  {
    slug: "flat-earth", title: "Flat Earth", category: "reversing", difficulty: "hard", fathoms: 300,
    prompt: "The binary is packed. Restore it and read the secret.",
    description: "Coming soon — reverse a packed ELF binary to recover the flag. Requires a real downloadable binary; landing once the artifact pipeline is ready.",
    hints: ["upx -d is a good first move."], files: [], kind: "download", active: false, flag: "VO{packed_binary_unpacked}",
  },
  {
    slug: "abyssal-overflow", title: "Abyssal Overflow", category: "pwn", difficulty: "insane", fathoms: 500,
    prompt: "No canary, known libc. Redirect execution.",
    description: "Coming soon — a classic ret2libc. Full hands-on pwn challenges arrive when per-challenge sandboxes are funded.",
    hints: ["Leak libc, then ret2system."], files: [], kind: "download", active: false, flag: "VO{ret2libc_in_the_deep}",
  },
];

async function main() {
  console.log("🌱 Seeding products...");
  const PRODUCTS = [
    { slug: "docx", name: "Docx", description: "Enterprise document extraction and intelligence", basePlan: "starter" },
    { slug: "pentx", name: "PentX", description: "Advanced penetration testing toolkit", basePlan: "starter" },
    { slug: "filex", name: "FILEx", description: "Intelligent file analysis and forensics", basePlan: "starter" },
    { slug: "assetxocean", name: "AssetxOcean", description: "Asset discovery and intelligence", basePlan: "starter" },
  ];
  for (const p of PRODUCTS) {
    await db.product.upsert({
      where: { slug: p.slug },
      create: p,
      update: { name: p.name, description: p.description },
    });
  }
  console.log(`✓ Seeded ${PRODUCTS.length} products`);

  console.log("🌱 Seeding roles...");
  const ROLES = [
    { name: "superadmin", level: 0, desc: "VaultOcean superadmin (all access)" },
    { name: "admin", level: 1, desc: "Company admin (product admin)" },
    { name: "manager", level: 2, desc: "Manager (delegate users)" },
    { name: "lead", level: 3, desc: "Lead (create batches)" },
    { name: "member", level: 4, desc: "Member (upload/verify)" },
    { name: "viewer", level: 5, desc: "Viewer (read-only)" },
  ];
  for (const r of ROLES) {
    await db.role.upsert({
      where: { name: r.name },
      create: {
        ...r,
        defaultPermissions: JSON.stringify({
          read: r.level <= 3,
          write: r.level <= 2,
          upload: r.level <= 3,
          view: true,
        }),
      },
      update: { desc: r.desc },
    });
  }
  console.log(`✓ Seeded ${ROLES.length} roles`);

  for (const t of TOOLS) await db.tool.upsert({ where: { slug: t.slug }, create: t, update: t });
  for (const w of WRITEUPS) await db.writeup.upsert({ where: { slug: w.slug }, create: w, update: w });

  for (const c of CHALLENGES) {
    const data = {
      slug: c.slug, title: c.title, category: c.category, difficulty: c.difficulty, fathoms: c.fathoms,
      prompt: c.prompt, description: c.description, hints: JSON.stringify(c.hints),
      files: JSON.stringify(c.files), kind: c.kind, active: c.active, flagHash: sha256(c.flag),
    };
    await db.challenge.upsert({ where: { slug: c.slug }, create: data, update: data });
  }

  console.log("✅ Seeded:", {
    products: await db.product.count(),
    roles: await db.role.count(),
    tools: await db.tool.count(),
    writeups: await db.writeup.count(),
    challenges: await db.challenge.count(),
    active_challenges: await db.challenge.count({ where: { active: true } }),
  });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
