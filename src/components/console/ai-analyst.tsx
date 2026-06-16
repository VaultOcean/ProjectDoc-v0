"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, ArrowUp, ShieldCheck, Loader2 } from "lucide-react";

type Message = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "What should I fix first?",
  "Explain this finding in plain English",
  "Draft a board-ready summary",
  "What is CSP and why does it matter?",
];

export function AiAnalyst({ insight, context }: { insight: string; context?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const userKey = typeof window !== "undefined" ? (localStorage.getItem("vo_anthropic_key") ?? "") : "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (userKey) headers["x-anthropic-key"] = userKey;
      const res = await fetch("/api/console/analyst", {
        method: "POST",
        headers,
        body: JSON.stringify({ question: q, context }),
      });
      const data = await res.json() as { ok: boolean; answer?: string; error?: string };
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer ?? data.error ?? "No response." },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Network error. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="c-btn c-btn-accent fixed bottom-6 right-6 z-40 c-float !rounded-2xl !px-4 !py-3 shadow-2xl"
        aria-label="Open AI analyst"
      >
        <Sparkles className="h-4 w-4" />
        <span className="font-medium">Ask the Analyst</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="AI Security Analyst">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(2,8,16,0.55)", backdropFilter: "blur(4px)" }}
            onClick={() => setOpen(false)}
          />
          <aside className="c-rise absolute right-0 top-0 flex h-dvh w-full max-w-md flex-col p-3">
            <div className="c-card flex h-full flex-col overflow-hidden">

              {/* Header */}
              <div className="flex items-center gap-3 border-b px-5 py-4" style={{ borderColor: "var(--c-border)" }}>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl c-accent-bar text-[#04121f]">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[15px] font-medium">AI Security Analyst</p>
                  <p className="text-xs" style={{ color: "var(--c-muted)" }}>Reasoning over your live surface</p>
                </div>
                <button className="c-btn !ml-auto !px-2 !py-2" onClick={() => setOpen(false)} aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
                {/* Initial insight card */}
                <div className="c-glass p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" style={{ color: "var(--c-accent)" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--c-muted)" }}>
                      Initial analysis
                    </span>
                  </div>
                  <p className="text-[14px] leading-relaxed">{insight}</p>
                </div>

                {/* Suggestion chips — show only when no messages yet */}
                {messages.length === 0 && (
                  <div className="space-y-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => ask(s)}
                        className="c-glass c-hover w-full px-4 py-3 text-left text-[13px]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Conversation */}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`rounded-xl px-4 py-3 text-[13px] leading-relaxed ${
                      m.role === "user"
                        ? "ml-6 text-right"
                        : "c-glass mr-6"
                    }`}
                    style={m.role === "user" ? { background: "var(--c-accent)", color: "#04121f" } : {}}
                  >
                    {m.text}
                  </div>
                ))}

                {loading && (
                  <div className="c-glass mr-6 flex items-center gap-2 rounded-xl px-4 py-3">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "var(--c-accent)" }} />
                    <span className="text-[13px]" style={{ color: "var(--c-muted)" }}>Analyzing…</span>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t p-3" style={{ borderColor: "var(--c-border)" }}>
                <form
                  onSubmit={(e) => { e.preventDefault(); ask(input); }}
                  className="c-glass flex items-center gap-2 px-3 py-2"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything about your security posture…"
                    className="flex-1 bg-transparent text-[13px] outline-none"
                    style={{ color: "var(--c-text)" }}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="c-btn c-btn-accent !px-2.5 !py-2 disabled:opacity-40"
                    aria-label="Send"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
