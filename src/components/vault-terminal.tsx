"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/cn";

/* ── Types ──────────────────────────────────────────────── */
type Color = "tide" | "red" | "yellow" | "blue" | "gray" | "white" | "muted" | "purple";
type Line  = { text: string; color?: Color; raw?: boolean };

const C: Record<Color, string> = {
  tide:   "text-tide",
  red:    "text-red-400",
  yellow: "text-yellow-400",
  blue:   "text-blue-400",
  gray:   "text-zinc-500",
  white:  "text-zinc-100",
  muted:  "text-zinc-400",
  purple: "text-purple-400",
};

/* ── Client-side crypto (Web Crypto API) ─────────────────── */
async function digest(algo: string, msg: string): Promise<string> {
  const map: Record<string, string> = { sha256: "SHA-256", sha1: "SHA-1", sha512: "SHA-512", sha384: "SHA-384" };
  const a = map[algo.toLowerCase()];
  if (!a) throw new Error(`Unknown algo. Use: sha256, sha1, sha512, sha384`);
  const buf = await crypto.subtle.digest(a, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function b64e(s: string) { try { return btoa(unescape(encodeURIComponent(s))); } catch { return "[encode error]"; } }
function b64d(s: string) { try { return decodeURIComponent(escape(atob(s))); } catch { return "[decode error — not valid base64]"; } }
function hexe(s: string) { return Array.from(new TextEncoder().encode(s)).map((b) => b.toString(16).padStart(2,"0")).join(""); }
function hexd(s: string) { try { const b = s.match(/.{1,2}/g)?.map((x) => parseInt(x,16)) ?? []; return new TextDecoder().decode(new Uint8Array(b)); } catch { return "[decode error]"; } }
function urle(s: string) { return encodeURIComponent(s); }
function urld(s: string) { try { return decodeURIComponent(s); } catch { return "[decode error]"; } }

function decodeJwt(token: string): Line[] {
  const parts = token.split(".");
  if (parts.length < 2) return [{ text: "[-] Not a valid JWT (expected header.payload.signature)", color: "red" }];
  try {
    const header  = JSON.parse(b64d(parts[0].replace(/-/g,"+").replace(/_/g,"/")));
    const payload = JSON.parse(b64d(parts[1].replace(/-/g,"+").replace(/_/g,"/")));
    const lines: Line[] = [
      { text: "[+] JWT decoded", color: "tide" },
      { text: "" },
      { text: "  HEADER:", color: "muted" },
      ...Object.entries(header).map(([k,v]) => ({ text: `    ${k}: ${JSON.stringify(v)}`, color: "white" as Color })),
      { text: "" },
      { text: "  PAYLOAD:", color: "muted" },
      ...Object.entries(payload).map(([k,v]) => {
        const line = { text: `    ${k}: ${JSON.stringify(v)}`, color: "white" as Color };
        if (k === "exp") {
          const exp = new Date((v as number) * 1000);
          const expired = exp < new Date();
          return { text: `    ${k}: ${JSON.stringify(v)} → ${exp.toISOString()} ${expired ? "[EXPIRED]" : "[valid]"}`, color: expired ? "red" as Color : "tide" as Color };
        }
        return line;
      }),
      { text: "" },
      { text: `  SIGNATURE: ${parts[2] ? parts[2].slice(0,20) + "…" : "none"}`, color: "muted" },
      { text: "" },
      { text: "  [!] Signature not verified — use a trusted library for auth decisions.", color: "yellow" },
    ];
    return lines;
  } catch (e) {
    return [{ text: `[-] Failed to decode JWT: ${e instanceof Error ? e.message : "unknown error"}`, color: "red" }];
  }
}

/* ── Help text ───────────────────────────────────────────── */
const HELP: Line[] = [
  { text: "VaultOcean Terminal — available commands:", color: "tide" },
  { text: "" },
  { text: "  RECON", color: "muted" },
  { text: "    scan <domain>              Security header analysis (grade A+ to F)", color: "white" },
  { text: "    subdomains <domain>        Certificate transparency subdomain enum", color: "white" },
  { text: "    dns <domain> [type]        DNS lookup via Cloudflare (A/MX/TXT/NS…)", color: "white" },
  { text: "    ip <address>               IP geolocation + Shodan InternetDB", color: "white" },
  { text: "    wayback <domain>           Historical URLs from Wayback Machine", color: "white" },
  { text: "    csp <header-string>        Analyze a Content-Security-Policy header", color: "white" },
  { text: "" },
  { text: "  CRYPTO & ENCODING", color: "muted" },
  { text: "    hash <algo> <text>         Compute hash (sha256 | sha1 | sha512 | sha384)", color: "white" },
  { text: "    encode <type> <text>       Encode (base64 | hex | url)", color: "white" },
  { text: "    decode <type> <text>       Decode (base64 | hex | url)", color: "white" },
  { text: "    jwt <token>                Decode JWT header + payload (offline)", color: "white" },
  { text: "" },
  { text: "  MISC", color: "muted" },
  { text: "    whoami                     Current session info", color: "white" },
  { text: "    cve <CVE-ID>               Fetch CVE from NVD", color: "white" },
  { text: "    clear / cls                Clear terminal", color: "white" },
  { text: "    help                       This help", color: "white" },
  { text: "" },
  { text: "  Arrow Up/Down = history  ·  Ctrl+C = cancel  ·  Ctrl+L = clear", color: "gray" },
];

/* ── Banner ──────────────────────────────────────────────── */
function banner(handle: string): Line[] {
  return [
    { text: "██╗   ██╗ ██████╗     ████████╗███████╗██████╗ ███╗   ███╗", color: "tide" },
    { text: "██║   ██║██╔═══██╗    ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║", color: "tide" },
    { text: "██║   ██║██║   ██║       ██║   █████╗  ██████╔╝██╔████╔██║", color: "tide" },
    { text: "╚██╗ ██╔╝██║   ██║       ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║", color: "tide" },
    { text: " ╚████╔╝ ╚██████╔╝       ██║   ███████╗██║  ██║██║ ╚═╝ ██║", color: "tide" },
    { text: "  ╚═══╝   ╚═════╝        ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝", color: "tide" },
    { text: "" },
    { text: `  Ethical Hackers OS  ·  Terminal v1.0  ·  @${handle}`, color: "muted" },
    { text: "  Type 'help' for commands. All operations are PASSIVE (no active probing).", color: "gray" },
    { text: "" },
  ];
}

/* ── Main component ──────────────────────────────────────── */
export function VaultTerminal({ handle }: { handle: string }) {
  const [lines, setLines]     = useState<Line[]>(() => banner(handle));
  const [input, setInput]     = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [busy, setBusy]       = useState(false);
  const [busyMsg, setBusyMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, busyMsg]);

  const push = useCallback((...newLines: Line[]) => {
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  async function run(raw: string) {
    const cmd = raw.trim();
    if (!cmd) return;

    push({ text: `vo@ocean:~$ ${cmd}`, color: "white" });
    setHistory((h) => [cmd, ...h.slice(0, 99)]);
    setHistIdx(-1);

    const parts = cmd.split(/\s+/);
    const name  = parts[0].toLowerCase();
    const args  = parts.slice(1);

    if (name === "clear" || name === "cls") { setLines([]); return; }
    if (name === "help") { push(...HELP, { text: "" }); return; }
    if (name === "whoami") {
      push(
        { text: `[+] Handle:  @${handle}`, color: "tide" },
        { text: `[+] Session: authenticated`, color: "tide" },
        { text: `[+] Host:    vaultocean.com`, color: "muted" },
        { text: "" }
      );
      return;
    }

    /* ── Encoding / crypto (client-side, instant) ── */
    if (name === "jwt") {
      const token = args.join("").trim();
      if (!token) { push({ text: "Usage: jwt <token>", color: "yellow" }); return; }
      push(...decodeJwt(token), { text: "" });
      return;
    }

    if (name === "hash") {
      const [algo, ...rest] = args;
      const text = rest.join(" ");
      if (!algo || !text) { push({ text: "Usage: hash <sha256|sha1|sha512> <text>", color: "yellow" }); return; }
      try {
        const result = await digest(algo, text);
        push({ text: `[+] ${algo.toUpperCase()}: ${result}`, color: "tide" }, { text: "" });
      } catch (e) {
        push({ text: `[-] ${e instanceof Error ? e.message : "Error"}`, color: "red" }, { text: "" });
      }
      return;
    }

    if (name === "encode" || name === "decode") {
      const [type, ...rest] = args;
      const text = rest.join(" ");
      if (!type || !text) { push({ text: `Usage: ${name} <base64|hex|url> <text>`, color: "yellow" }); return; }
      let result = "";
      const t = type.toLowerCase();
      try {
        if (name === "encode") {
          if (t === "base64") result = b64e(text);
          else if (t === "hex") result = hexe(text);
          else if (t === "url") result = urle(text);
          else { push({ text: "[-] Type must be: base64, hex, url", color: "red" }); return; }
        } else {
          if (t === "base64") result = b64d(text);
          else if (t === "hex") result = hexd(text);
          else if (t === "url") result = urld(text);
          else { push({ text: "[-] Type must be: base64, hex, url", color: "red" }); return; }
        }
        push({ text: `[+] ${type.toUpperCase()}: ${result}`, color: "tide" }, { text: "" });
      } catch (e) {
        push({ text: `[-] ${e instanceof Error ? e.message : "Error"}`, color: "red" }, { text: "" });
      }
      return;
    }

    /* ── API-backed commands ── */
    const API_CMDS = ["scan","subdomains","dns","ip","wayback","csp","cve"];
    if (!API_CMDS.includes(name)) {
      push({ text: `[-] Unknown command: ${name}. Type 'help' for commands.`, color: "red" }, { text: "" });
      return;
    }

    setBusy(true);

    try {
      if (name === "scan") {
        const domain = args[0];
        if (!domain) { push({ text: "Usage: scan <domain>", color: "yellow" }, { text: "" }); return; }
        setBusyMsg(`[*] Scanning ${domain}…`);
        const d = await fetch("/api/tools/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: domain }),
        }).then((r) => r.json()) as { ok: boolean; grade?: string; score?: number; findings?: { severity: string; title: string; detail: string }[]; error?: string };
        if (!d.ok) { push({ text: `[-] ${d.error}`, color: "red" }, { text: "" }); return; }
        const sevColor: Record<string, Color> = { critical:"red", high:"red", medium:"yellow", low:"blue", good:"tide", info:"gray" };
        const sevPrefix: Record<string, string> = { critical:"[!!]", high:"[-]", medium:"[~]", low:"[i]", good:"[+]", info:"[i]" };
        push(
          { text: `[+] ${domain}  Grade: ${d.grade}  Score: ${d.score}/100`, color: "tide" },
          { text: "" },
          ...(d.findings ?? []).map((f) => ({
            text: `  ${sevPrefix[f.severity] ?? "[?]"} ${f.title}: ${f.detail}`,
            color: sevColor[f.severity] ?? "muted",
          })),
          { text: "" }
        );
        return;
      }

      if (name === "subdomains") {
        const domain = args[0];
        if (!domain) { push({ text: "Usage: subdomains <domain>", color: "yellow" }, { text: "" }); return; }
        setBusyMsg(`[*] Enumerating subdomains for ${domain}…`);
        const d = await fetch("/api/tools/subdomains", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        }).then((r) => r.json()) as { ok: boolean; count?: number; subdomains?: { name: string }[]; error?: string };
        if (!d.ok) { push({ text: `[-] ${d.error}`, color: "red" }, { text: "" }); return; }
        push(
          { text: `[+] Found ${d.count} subdomains for ${domain}`, color: "tide" },
          { text: "" },
          ...(d.subdomains ?? []).slice(0, 30).map((s) => ({ text: `  ${s.name}`, color: "white" as Color })),
          ...(((d.count ?? 0) > 30) ? [{ text: `  … and ${(d.count ?? 0) - 30} more. Use the Recon tool to export all.`, color: "muted" as Color }] : []),
          { text: "" }
        );
        return;
      }

      if (name === "dns") {
        const [domain, type = "A"] = args;
        if (!domain) { push({ text: "Usage: dns <domain> [A|MX|TXT|NS|CNAME|AAAA|SOA]", color: "yellow" }, { text: "" }); return; }
        setBusyMsg(`[*] DNS lookup ${type} ${domain}…`);
        const d = await fetch("/api/tools/dns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain, type }),
        }).then((r) => r.json()) as { ok: boolean; status?: string; records?: { data: string; TTL: number }[]; error?: string };
        if (!d.ok) { push({ text: `[-] ${d.error}`, color: "red" }, { text: "" }); return; }
        push(
          { text: `[+] ${type} records for ${domain}  (${d.status})`, color: "tide" },
          { text: "" },
          ...(d.records?.length ? d.records.map((r) => ({ text: `  ${r.data}  [TTL ${r.TTL}s]`, color: "white" as Color })) : [{ text: "  No records found.", color: "muted" as Color }]),
          { text: "" }
        );
        return;
      }

      if (name === "ip") {
        const addr = args[0];
        if (!addr) { push({ text: "Usage: ip <address>", color: "yellow" }, { text: "" }); return; }
        setBusyMsg(`[*] Looking up ${addr}…`);
        const d = await fetch("/api/tools/ip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ip: addr }),
        }).then((r) => r.json()) as { ok: boolean; geo?: Record<string, unknown>; shodan?: { ports?: number[]; tags?: string[]; cpes?: string[]; hostnames?: string[] } | null; error?: string };
        if (!d.ok) { push({ text: `[-] ${d.error}`, color: "red" }, { text: "" }); return; }
        const g = d.geo ?? {};
        push(
          { text: `[+] IP: ${addr}`, color: "tide" },
          { text: "" },
          { text: `  Location: ${g.city}, ${g.regionName}, ${g.country} (${g.countryCode})`, color: "white" },
          { text: `  ISP:      ${g.isp ?? "—"}`, color: "white" },
          { text: `  ASN:      ${g.as ?? "—"}`, color: "white" },
          { text: `  Org:      ${g.org ?? "—"}`, color: "white" },
          { text: `  Timezone: ${g.timezone ?? "—"}`, color: "muted" },
          { text: `  Hosting:  ${g.hosting ? "YES (datacenter/VPS)" : "No"}  Proxy: ${g.proxy ? "YES" : "No"}  Mobile: ${g.mobile ? "Yes" : "No"}`, color: (g.hosting || g.proxy) ? "yellow" : "muted" },
          ...(d.shodan?.ports?.length ? ([
            { text: "" } as Line,
            { text: `  Open ports (Shodan): ${d.shodan.ports.join(", ")}`, color: "yellow" as Color },
            ...(d.shodan.tags?.length ? [{ text: `  Tags: ${d.shodan.tags.join(", ")}`, color: "red" as Color }] : []),
            ...(d.shodan.cpes?.length ? [{ text: `  CPEs: ${d.shodan.cpes.slice(0,3).join(", ")}`, color: "muted" as Color }] : []),
          ] as Line[]) : ([{ text: "  Shodan: no open ports indexed", color: "gray" as Color }] as Line[])),
          { text: "" }
        );
        return;
      }

      if (name === "wayback") {
        const domain = args[0];
        if (!domain) { push({ text: "Usage: wayback <domain>", color: "yellow" }, { text: "" }); return; }
        setBusyMsg(`[*] Fetching Wayback URLs for ${domain}…`);
        const d = await fetch("/api/tools/wayback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        }).then((r) => r.json()) as { ok: boolean; count?: number; urls?: { url: string; date: string | null }[]; error?: string };
        if (!d.ok) { push({ text: `[-] ${d.error}`, color: "red" }, { text: "" }); return; }
        push(
          { text: `[+] Wayback Machine: ${d.count} archived URLs for ${domain}`, color: "tide" },
          { text: "" },
          ...(d.urls ?? []).slice(0, 25).map((u) => ({ text: `  [${u.date ?? "????"}] ${u.url}`, color: "white" as Color })),
          ...(((d.count ?? 0) > 25) ? [{ text: `  … and ${(d.count ?? 0) - 25} more.`, color: "muted" as Color }] : []),
          { text: "" }
        );
        return;
      }

      if (name === "csp") {
        const header = args.join(" ");
        if (!header) { push({ text: 'Usage: csp "default-src \'self\'; script-src \'unsafe-inline\'"', color: "yellow" }, { text: "" }); return; }
        setBusyMsg("[*] Analyzing CSP…");
        const d = await fetch("/api/tools/csp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ header }),
        }).then((r) => r.json()) as { ok: boolean; grade?: string; score?: number; findings?: { severity: string; title: string; detail: string }[]; error?: string };
        if (!d.ok) { push({ text: `[-] ${d.error}`, color: "red" }, { text: "" }); return; }
        const sc: Record<string, Color> = { critical:"red", high:"red", medium:"yellow", low:"blue", good:"tide" };
        push(
          { text: `[+] CSP Grade: ${d.grade}  Score: ${d.score}/100`, color: "tide" },
          { text: "" },
          ...(d.findings ?? []).map((f) => ({ text: `  ${f.title}: ${f.detail}`, color: sc[f.severity] ?? "muted" as Color })),
          { text: "" }
        );
        return;
      }

      if (name === "cve") {
        const id = args[0]?.toUpperCase();
        if (!id || !id.startsWith("CVE-")) { push({ text: "Usage: cve CVE-2024-1234", color: "yellow" }, { text: "" }); return; }
        setBusyMsg(`[*] Fetching ${id} from NVD…`);
        const d = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${id}`).then((r) => r.json()) as { vulnerabilities?: { cve: { id: string; descriptions: { lang: string; value: string }[]; metrics?: { cvssMetricV31?: { cvssData: { baseScore: number; baseSeverity: string } }[] } } }[] };
        const vuln = d.vulnerabilities?.[0]?.cve;
        if (!vuln) { push({ text: `[-] ${id} not found in NVD.`, color: "red" }, { text: "" }); return; }
        const desc = vuln.descriptions.find((d) => d.lang === "en")?.value ?? "No description.";
        const score = vuln.metrics?.cvssMetricV31?.[0]?.cvssData;
        push(
          { text: `[+] ${id}`, color: "tide" },
          ...(score ? [{ text: `  CVSS: ${score.baseScore} (${score.baseSeverity})`, color: (score.baseSeverity === "CRITICAL" || score.baseSeverity === "HIGH") ? "red" as Color : "yellow" as Color }] : []),
          { text: "" },
          { text: `  ${desc}`, color: "white" },
          { text: "" },
          { text: `  https://nvd.nist.gov/vuln/detail/${id}`, color: "blue" },
          { text: "" }
        );
        return;
      }

    } catch (e) {
      push({ text: `[-] Error: ${e instanceof Error ? e.message : "Unknown error"}`, color: "red" }, { text: "" });
    } finally {
      setBusy(false);
      setBusyMsg("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const val = input;
      setInput("");
      run(val);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      setInput(history[idx] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx === -1 ? "" : (history[idx] ?? ""));
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      push({ text: `vo@ocean:~$ ${input}^C`, color: "gray" });
      setInput("");
      setBusy(false);
      setBusyMsg("");
    }
  }

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-700/60 bg-[#0d0d10] shadow-2xl"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Title bar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-zinc-800 bg-zinc-900/80 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="mx-auto font-mono text-[11px] text-zinc-400">
          vault-terminal — @{handle}
        </span>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed">
        {lines.map((l, i) => (
          <div key={i} className={cn("whitespace-pre-wrap break-all", l.color ? C[l.color] : "text-zinc-300")}>
            {l.text || " "}
          </div>
        ))}
        {busyMsg && (
          <div className="flex items-center gap-2 text-tide">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-tide" />
            <span>{busyMsg}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex shrink-0 items-center gap-2 border-t border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <span className="shrink-0 font-mono text-[13px] text-tide">vo@ocean:~$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-transparent font-mono text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600 disabled:opacity-60"
          placeholder={busy ? "running…" : "type a command…"}
        />
        {busy && <span className="h-2 w-2 animate-pulse rounded-full bg-tide" />}
      </div>
    </div>
  );
}
