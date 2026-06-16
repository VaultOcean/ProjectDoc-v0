"use client";

import { useState } from "react";
import {
  CheckCircle2, Clock, XCircle, AlertTriangle,
  Eye, EyeOff, ExternalLink, Loader2, Save, Wifi,
} from "lucide-react";
import { cn } from "@/lib/cn";

export type ConnectorStatus = "pending" | "approved" | "active" | "suspended";

interface ConfigSnapshot {
  orgName: string;
  serverUrl: string;
  apiKeyMasked: string;
  hasApiKey: boolean;
  maxFileSizeMb: number;
  status: ConnectorStatus;
  adminNotes: string;
  updatedAt: string;
}

function StatusBadge({ status }: { status: ConnectorStatus }) {
  const map: Record<ConnectorStatus, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
    pending:   { label: "Pending approval",  cls: "text-yellow-400 bg-yellow-950/40 border-yellow-900/50", Icon: Clock },
    approved:  { label: "Approved",          cls: "text-blue-400 bg-blue-950/40 border-blue-900/50",       Icon: CheckCircle2 },
    active:    { label: "Active",            cls: "text-green-400 bg-green-950/40 border-green-900/50",    Icon: CheckCircle2 },
    suspended: { label: "Suspended",         cls: "text-red-400 bg-red-950/40 border-red-900/50",          Icon: XCircle },
  };
  const { label, cls, Icon } = map[status] ?? map.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold", cls)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export function TenantConfigForm({ initial }: { initial: ConfigSnapshot | null }) {
  const [orgName,       setOrgName]       = useState(initial?.orgName       ?? "");
  const [serverUrl,     setServerUrl]     = useState(initial?.serverUrl     ?? "");
  const [apiKey,        setApiKey]        = useState("");
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(initial?.maxFileSizeMb ?? 25);
  const [showKey,       setShowKey]       = useState(false);

  const [saving,   setSaving]   = useState(false);
  const [testing,  setTesting]  = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [error,    setError]    = useState("");

  const [currentStatus, setCurrentStatus] = useState<ConnectorStatus>(
    initial?.status ?? "pending"
  );
  const hasExistingKey = initial?.hasApiKey ?? false;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false); setTestResult(null);

    try {
      const res  = await fetch("/api/settings/tenant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName, serverUrl, apiKey: apiKey || undefined, maxFileSizeMb }),
      });
      const data = await res.json() as { ok: boolean; status?: ConnectorStatus; error?: string; resetToReview?: boolean };

      if (!data.ok) { setError(data.error ?? "Save failed"); return; }

      if (data.status) setCurrentStatus(data.status);
      setSaved(true);
      setApiKey("");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Network error — could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    if (!serverUrl) { setTestResult({ ok: false, message: "Enter a server URL first." }); return; }
    setTesting(true); setTestResult(null);

    try {
      /* Call through VaultOcean's /api/assets/extract with a tiny test payload */
      const res  = await fetch("/api/assets/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content:  "__vo_ping__",
          mimeType: "text/plain",
          mode:     "scope",
        }),
      });
      const data = await res.json() as { ok: boolean; error?: string; code?: string; columns?: string[] };

      if (data.code === "NO_CONNECTOR") {
        setTestResult({ ok: false, message: "Save your configuration before testing." });
      } else if (data.code === "NOT_ACTIVE") {
        setTestResult({ ok: false, message: "Connector saved but not yet approved by VaultOcean." });
      } else if (data.ok || (data.columns !== undefined)) {
        setTestResult({ ok: true, message: "Eagle server reached and responded correctly." });
      } else {
        setTestResult({ ok: false, message: data.error ?? "Eagle server returned an error." });
      }
    } catch {
      setTestResult({ ok: false, message: "Network error — could not reach VaultOcean API." });
    } finally {
      setTesting(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-8">

      {/* Current status */}
      {initial && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/30 px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">Connector status</p>
            <div className="mt-1.5">
              <StatusBadge status={currentStatus} />
            </div>
          </div>
          {initial.adminNotes && (
            <p className="font-mono text-[11px] text-zinc-500 max-w-sm">{initial.adminNotes}</p>
          )}
          {currentStatus === "pending" && (
            <p className="font-mono text-[10px] text-yellow-600 max-w-xs">
              VaultOcean reviews each server registration before activation. You will be notified by email once approved.
            </p>
          )}
        </div>
      )}

      {/* Organisation */}
      <fieldset className="space-y-4">
        <legend className="label-mono">Organisation</legend>
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] text-zinc-500">Organisation name</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Acme Security Ltd."
            className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-[13px] text-zinc-200 outline-none focus:border-tide/50 transition-colors"
          />
          <p className="font-mono text-[10px] text-zinc-700">Shown to VaultOcean admins during approval review.</p>
        </div>
      </fieldset>

      {/* Eagle server */}
      <fieldset className="space-y-4">
        <legend className="label-mono">Eagle Server</legend>

        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] text-zinc-500">Server URL <span className="text-red-500">*</span></label>
          <input
            type="url"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="https://eagle.your-domain.internal"
            required
            className="w-full max-w-lg rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-[13px] text-zinc-200 outline-none focus:border-tide/50 transition-colors"
          />
          <p className="font-mono text-[10px] text-zinc-700">
            The base URL of your Eagle OCR server. VaultOcean will POST to <code className="text-zinc-500">{serverUrl || "https://…"}/extract</code>.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] text-zinc-500">API key <span className="text-red-500">*</span></label>
          <div className="relative max-w-lg">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasExistingKey ? "Enter new key to replace existing" : "Your Eagle server API key"}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 pr-10 font-mono text-[13px] text-zinc-200 outline-none focus:border-tide/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {hasExistingKey && !apiKey && (
            <p className="font-mono text-[10px] text-zinc-700">
              Existing key on file — leave blank to keep it.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] text-zinc-500">Max file size (MB)</label>
          <input
            type="number"
            min={1}
            max={100}
            value={maxFileSizeMb}
            onChange={(e) => setMaxFileSizeMb(Number(e.target.value))}
            className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-[13px] text-zinc-200 outline-none focus:border-tide/50 transition-colors"
          />
        </div>
      </fieldset>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <p className="font-mono text-[11px] text-red-300">{error}</p>
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div className={cn(
          "flex items-start gap-2.5 rounded-xl border px-4 py-3",
          testResult.ok
            ? "border-green-900/40 bg-green-950/20"
            : "border-orange-900/40 bg-orange-950/20"
        )}>
          {testResult.ok
            ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
            : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />}
          <p className={cn("font-mono text-[11px]", testResult.ok ? "text-green-300" : "text-orange-300")}>
            {testResult.message}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className={cn(
            "flex items-center gap-2 rounded-xl px-5 py-2.5 font-mono text-[12px] font-semibold transition-all",
            saving ? "bg-zinc-800 text-zinc-500 cursor-wait" : "bg-tide text-abyss-900 hover:bg-tide-bright"
          )}
        >
          {saving
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
            : saved
            ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved</>
            : <><Save className="h-3.5 w-3.5" /> Save configuration</>}
        </button>

        <button
          type="button"
          onClick={testConnection}
          disabled={testing || currentStatus !== "active"}
          title={currentStatus !== "active" ? "Connector must be active to test" : ""}
          className="flex items-center gap-2 rounded-xl border border-zinc-700 px-5 py-2.5 font-mono text-[12px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {testing
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Testing…</>
            : <><Wifi className="h-3.5 w-3.5" /> Test connection</>}
        </button>
      </div>

      <p className="font-mono text-[10px] text-zinc-700">
        Saving a new server URL or API key resets approval to <span className="text-yellow-600">pending</span> — VaultOcean will re-review within 24 h.
      </p>
    </form>
  );
}
