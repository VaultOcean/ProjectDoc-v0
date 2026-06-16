import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });

  if (rateLimit(`analyst:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const { question, context } = body as { question?: string; context?: string };
  if (!question || typeof question !== "string" || question.length > 1000) {
    return NextResponse.json({ ok: false, error: "Provide a question." }, { status: 400 });
  }

  // User's own key takes priority over server-side key
  const apiKey = req.headers.get("x-anthropic-key") || process.env.ANTHROPIC_API_KEY;

  // Deterministic fallback if no API key
  if (!apiKey) {
    const fallback = generateDeterministicInsight(question, context ?? "");
    return NextResponse.json({ ok: true, answer: fallback });
  }

  try {
    const systemPrompt = `You are a senior security analyst reviewing scan results for Vault Ocean, a security community platform.
You have access to the following scan context:
${context ?? "No scan data available."}

Respond as a concise, technical security expert. Be specific, actionable, and reference actual findings when possible.
Keep responses under 200 words. Use markdown sparingly.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: question }],
      }),
    });

    if (!res.ok) {
      const fallback = generateDeterministicInsight(question, context ?? "");
      return NextResponse.json({ ok: true, answer: fallback });
    }

    const data = await res.json() as { content: { type: string; text: string }[] };
    const answer = data.content?.find((b) => b.type === "text")?.text ?? "";
    return NextResponse.json({ ok: true, answer });
  } catch {
    const fallback = generateDeterministicInsight(question, context ?? "");
    return NextResponse.json({ ok: true, answer: fallback });
  }
}

function generateDeterministicInsight(question: string, context: string): string {
  const q = question.toLowerCase();
  if (q.includes("fix first") || q.includes("priorit")) {
    return "Start with any **Critical** or **High** severity findings — these typically represent the highest exploitability risk. Missing HSTS exposes users to SSL stripping; missing CSP enables XSS without mitigation. Fix those headers at the server/CDN level, then work through Medium findings like clickjacking and MIME sniffing.";
  }
  if (q.includes("explain") || q.includes("plain english")) {
    return "Security headers are HTTP response instructions that tell browsers how to behave. Missing HSTS means a network attacker can intercept your connection before HTTPS kicks in. Missing CSP means injected scripts run with full trust. Each finding in this report includes a copy-pasteable fix — add them to your server or CDN config.";
  }
  if (q.includes("board") || q.includes("summary") || q.includes("executive")) {
    return context.includes("grade")
      ? "**Security posture summary:** The scanned domain has identifiable gaps in HTTP security headers. Key risks include potential SSL downgrade attacks and reduced XSS protection. Recommended actions: implement HSTS with preload, deploy a strict Content Security Policy, and add standard protective headers. Timeline: 1–2 sprint cycles for full remediation."
      : "No scan data available yet. Run a scan first, then ask for a board summary.";
  }
  if (q.includes("csp") || q.includes("content security")) {
    return "A Content Security Policy restricts what resources a page can load. Without it, any injected script (via XSS, supply chain, or compromised CDN) runs with full privileges. Start with `default-src 'self'; object-src 'none'; frame-ancestors 'none'` and tighten from there. The Arsenal tool CSPy can help you test and refine it.";
  }
  return "Based on your scan results, focus on the highest-severity findings first. Each finding includes a concrete fix string you can apply at the web server or CDN level. If you need clarification on any specific finding, ask me about it directly.";
}
