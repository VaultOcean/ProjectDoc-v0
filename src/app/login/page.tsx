import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Create your Vault Ocean Depth profile.",
};

const FEATURES = [
  { label: "Field — read a dispatch", earn: "+25ƒ",    detail: "Real bug-bounty breakdowns" },
  { label: "Lab — crack a flag",      earn: "+50–200ƒ", detail: "Live targets, real artifacts" },
  { label: "Draft — publish a post",  earn: "+50ƒ",    detail: "Your blog at /u/handle"      },
  { label: "Arsenal — merge a PR",    earn: "+100ƒ",   detail: "Open-source contributions"   },
];

const RANKS = ["Surface", "Shallows", "Twilight", "Midnight", "Abyssal", "Hadal"];

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(`/profile/${user.handle}`);

  return (
    <div className="grid min-h-[82vh] py-14 lg:grid-cols-[1fr_1fr] lg:gap-20">

      {/* ── Left: form ── */}
      <div className="flex flex-col justify-center">
        <Logo className="h-8 w-8" />

        <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-ink-primary sm:text-4xl">
          Enter the{" "}
          <span className="font-serif italic text-tide">deep.</span>
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-secondary">
          One profile. Everything you read, solve, build, and write — tracked in one place.
        </p>

        <div className="mt-8 max-w-sm">
          <AuthForm />
        </div>

        <p className="mt-5 flex max-w-sm items-start gap-2 text-[11px] leading-relaxed text-ink-muted">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tide" />
          Passwords hashed with bcrypt. Sessions use signed, httpOnly cookies.
        </p>
      </div>

      {/* ── Right: feature preview (desktop only) ── */}
      <div className="hidden flex-col justify-center gap-4 lg:flex">

        {/* Terminal */}
        <div className="term">
          <div className="term-bar">
            <span className="term-dot bg-[#ff5f57]" />
            <span className="term-dot bg-[#febc2e]" />
            <span className="term-dot bg-[#28c840]" />
            <span className="ml-3 font-mono text-[10px] text-ink-faint">
              vault ocean · depth profile
            </span>
          </div>
          <div className="space-y-2 p-5 font-mono text-[13px]">
            <p className="text-ink-muted">$ vo profile --init</p>
            {FEATURES.map((f) => (
              <p key={f.label} className="text-ink-secondary">
                <span className="text-tide">✓</span>{" "}
                {f.label}{" "}
                <span className="text-tide">{f.earn}</span>
                <span className="text-ink-faint"> — {f.detail}</span>
              </p>
            ))}
            <p className="text-ink-muted">
              <br />$ vo rank --list
            </p>
            <p className="text-ink-secondary">
              {RANKS.map((r, i) => (
                <span key={r}>
                  {i > 0 && <span className="text-ink-faint"> → </span>}
                  <span className={i === 0 ? "text-tide" : ""}>{r}</span>
                </span>
              ))}
            </p>
            <p className="text-ink-muted">
              <br />$ <span className="caret" />
            </p>
          </div>
        </div>

        {/* Fathom earn chips */}
        <div className="grid grid-cols-2 gap-2">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="flex items-center justify-between rounded-lg border border-hair bg-abyss-800/40 px-4 py-3"
            >
              <span className="font-mono text-[11px] text-ink-secondary">{f.label}</span>
              <span className="font-mono text-[11px] text-tide">{f.earn}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
