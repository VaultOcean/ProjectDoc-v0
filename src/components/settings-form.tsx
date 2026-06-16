"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Check, Key, Trash2 } from "lucide-react";

const LS_KEY = "vo_anthropic_key";

export function SettingsForm({ handle }: { handle: string }) {
  const [apiKey, setApiKey] = useState("");
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY) ?? "";
    if (stored) { setApiKey(stored); setHasKey(true); }
  }, []);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    localStorage.setItem(LS_KEY, trimmed);
    setHasKey(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function remove() {
    localStorage.removeItem(LS_KEY);
    setApiKey("");
    setHasKey(false);
  }

  return (
    <div className="space-y-8">
      {/* Profile info */}
      <section className="card p-6">
        <p className="label-mono mb-4">Account</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-secondary">Handle</span>
            <span className="font-mono text-sm text-ink-primary">@{handle}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-secondary">Profile URL</span>
            <span className="font-mono text-sm text-tide">vaultocean.com/profile/{handle}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-secondary">Blog URL</span>
            <span className="font-mono text-sm text-tide">vaultocean.com/u/{handle}</span>
          </div>
        </div>
      </section>

      {/* Anthropic API key */}
      <section className="card p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <Key className="h-4 w-4 text-tide" />
          <p className="label-mono">Anthropic API key</p>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-ink-secondary">
          Add your own{" "}
          <span className="font-mono text-tide">claude-haiku-4-5</span> key to power the AI
          Security Analyst in the Console. The key is stored in your browser&apos;s localStorage
          only — Vault Ocean never sees it.
        </p>

        {hasKey && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-tide/25 bg-tide/5 px-4 py-2.5">
            <Check className="h-4 w-4 text-tide" />
            <span className="flex-1 font-mono text-sm text-tide">API key saved in this browser</span>
            <button
              onClick={remove}
              className="flex items-center gap-1 font-mono text-[11px] text-ink-muted transition-colors hover:text-sev-high"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          </div>
        )}

        <form onSubmit={save} className="space-y-3">
          <label className="block">
            <span className="label-mono mb-1.5 block">Key</span>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                autoComplete="off"
                className="w-full rounded-lg border border-hair bg-abyss-800 px-4 py-2.5 pr-10 font-mono text-sm text-ink-primary outline-none placeholder:text-ink-faint transition-colors focus:border-tide/50 focus:ring-1 focus:ring-tide/20"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-secondary"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <button
            type="submit"
            disabled={!apiKey.trim()}
            className="btn-tide disabled:opacity-50"
          >
            {saved ? <><Check className="h-4 w-4" /> Saved</> : "Save key"}
          </button>
        </form>

        <p className="mt-4 font-mono text-[10px] leading-relaxed text-ink-faint">
          Get a key at console.anthropic.com · Only claude-haiku-4-5 is required (cheapest tier) ·
          Your key is never transmitted to vaultocean.com servers
        </p>
      </section>
    </div>
  );
}
