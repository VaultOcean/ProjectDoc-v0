import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "@/components/settings-form";

export const metadata: Metadata = { title: "Settings — Vault Ocean" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings");
  return (
    <div className="py-14 sm:py-20">
      <p className="overline">Settings</p>
      <h1 className="display display-lg mt-4 text-ink-primary">Your preferences</h1>
      <p className="mt-4 max-w-xl text-ink-secondary">
        API keys are stored in your browser only — they are never sent to Vault Ocean servers.
      </p>
      <div className="mt-12 max-w-xl space-y-8">
        <SettingsForm handle={user.handle} />
      </div>
    </div>
  );
}
