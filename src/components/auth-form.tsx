"use client";

import { useState } from "react";
import { Loader2, Eye, EyeOff, Mail, CheckCircle } from "lucide-react";

type Mode = "login" | "signup";
type Stage = "form" | "check_email" | "unverified";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("signup");
  const [stage, setStage] = useState<Stage>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendDone, setResendDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload =
        mode === "signup" ? { email, password, handle } : { email, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { ok: boolean; verify?: boolean; error?: string; email?: string; handle?: string };

      if (!data.ok) {
        if (data.error === "EMAIL_UNVERIFIED") {
          setStage("unverified");
          setBusy(false);
          return;
        }
        setError(data.error ?? "Something went wrong.");
        setBusy(false);
        return;
      }

      if (data.verify) {
        setStage("check_email");
        setBusy(false);
        return;
      }

      const next = new URLSearchParams(window.location.search).get("next");
      const dest = next && next.startsWith("/") ? next : `/profile/${data.handle}`;
      window.location.assign(dest);
    } catch {
      setError("Network error — try again.");
      setBusy(false);
    }
  }

  async function resend() {
    if (resendDone) return;
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResendDone(true);
  }

  if (stage === "check_email") {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-tide/30 bg-tide/10">
          <Mail className="h-6 w-6 text-tide" />
        </div>
        <div>
          <h2 className="font-display text-xl font-medium text-ink-primary">Check your inbox</h2>
          <p className="mt-2 text-sm text-ink-secondary">
            We sent a verification link to{" "}
            <span className="font-mono text-tide">{email}</span>.<br />
            Click it to activate your account.
          </p>
        </div>
        <p className="text-xs text-ink-faint">
          No email?{" "}
          <button
            type="button"
            onClick={resend}
            className="text-tide underline-offset-2 hover:underline disabled:opacity-50"
            disabled={resendDone}
          >
            {resendDone ? "Sent!" : "Resend"}
          </button>
          {" · "}
          <button
            type="button"
            onClick={() => { setStage("form"); setMode("login"); }}
            className="text-ink-muted underline-offset-2 hover:underline"
          >
            Back to sign in
          </button>
        </p>
      </div>
    );
  }

  if (stage === "unverified") {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10">
          <Mail className="h-6 w-6 text-amber-400" />
        </div>
        <div>
          <h2 className="font-display text-xl font-medium text-ink-primary">Verify your email first</h2>
          <p className="mt-2 text-sm text-ink-secondary">
            Your account isn&apos;t activated yet. Check{" "}
            <span className="font-mono text-tide">{email}</span> for the verification link.
          </p>
        </div>
        <button
          type="button"
          onClick={resend}
          disabled={resendDone}
          className="btn-tide w-full justify-center py-2.5 text-sm disabled:opacity-50"
        >
          {resendDone ? (
            <><CheckCircle className="h-4 w-4" /> Email sent</>
          ) : (
            "Resend verification email"
          )}
        </button>
        <button
          type="button"
          onClick={() => { setStage("form"); setError(null); }}
          className="block w-full text-xs text-ink-muted underline-offset-2 hover:underline"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Mode toggle */}
      <div className="mb-6 flex gap-1 rounded-lg border border-hair bg-abyss-900/60 p-1">
        {(["signup", "login"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(null); setStage("form"); }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              mode === m
                ? "bg-abyss-600 text-tide shadow-sm"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            {m === "signup" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <Field
            label="Handle"
            value={handle}
            onChange={setHandle}
            placeholder="e.g. h4cker_01"
            autoComplete="off"
            hint="3–24 chars · letters, numbers, _ or -"
          />
        )}
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          show={showPw}
          onToggle={() => setShowPw((v) => !v)}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder={mode === "signup" ? "at least 8 characters" : "your password"}
        />

        {error && (
          <p className="rounded-lg border border-sev-high/30 bg-sev-high/10 px-3 py-2.5 font-mono text-xs text-sev-high">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn-tide w-full justify-center py-3 text-sm"
          disabled={busy}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "signup" ? "Create account" : "Sign in"}
        </button>

        {mode === "signup" && (
          <p className="text-center font-mono text-[10px] text-ink-faint">
            A verification email will be sent to activate your account.
          </p>
        )}
      </form>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, autoComplete, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; autoComplete?: string; hint?: string;
}) {
  return (
    <label className="block">
      <span className="label-mono">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="mt-1.5 w-full rounded-lg border border-hair bg-abyss-800 px-4 py-2.5 text-sm text-ink-primary outline-none placeholder:text-ink-faint transition-colors focus:border-tide/50 focus:ring-1 focus:ring-tide/20"
      />
      {hint && <span className="mt-1.5 block font-mono text-[10px] text-ink-faint">{hint}</span>}
    </label>
  );
}

function PasswordField({
  label, value, onChange, show, onToggle, autoComplete, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; autoComplete?: string; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="label-mono">{label}</span>
      <div className="relative mt-1.5">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full rounded-lg border border-hair bg-abyss-800 px-4 py-2.5 pr-10 text-sm text-ink-primary outline-none placeholder:text-ink-faint transition-colors focus:border-tide/50 focus:ring-1 focus:ring-tide/20"
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-ink-secondary"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
