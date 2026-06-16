import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { VaultTerminal } from "@/components/vault-terminal";

export const metadata = { title: "Terminal — VaultOcean" };

export default async function TerminalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col px-4 py-4 lg:px-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-sm font-semibold text-zinc-200">Terminal</h1>
          <p className="font-mono text-[11px] text-zinc-500">
            Passive recon · Crypto · Encoding · CVE lookup — all in one shell
          </p>
        </div>
        <span className="rounded border border-zinc-700 bg-zinc-800/60 px-2 py-1 font-mono text-[10px] text-zinc-400">
          No active probing · Read-only
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <VaultTerminal handle={user.handle} />
      </div>
    </div>
  );
}
