import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Security",
  description: "Vault Ocean's security posture and responsible disclosure policy.",
};

const POSTURE = [
  ["Strict Content-Security-Policy", "No third-party scripts; frame-ancestors none; object-src none."],
  ["Hardened headers", "HSTS preload, X-Content-Type-Options, COOP/CORP, restrictive Permissions-Policy."],
  ["Server-side authorization", "Flag checks and privileged actions never trust the client."],
  ["Constant-time comparisons", "Flag verification resists timing oracles; rate-limited against brute force."],
  ["bcrypt-hashed passwords", "Credentials are hashed with bcrypt (cost 12) — plaintext is never stored or logged."],
  ["Open source", "The platform and its tools are auditable. Trust is earned by reading the code."],
];

export default function SecurityPage() {
  return (
    <>
      <PageHeader
        marker="security"
        title="Built to be trusted, not just told to be"
        description="This community is run by people who break things for a living, so the platform is held to that standard. No system is unbreakable — but here is what we do, plainly."
      />

      <div className="my-10 grid gap-4 sm:grid-cols-2">
        {POSTURE.map(([title, body]) => (
          <div key={title} className="card flex gap-4 p-6">
            <ShieldCheck className="h-5 w-5 shrink-0 text-tide" aria-hidden="true" />
            <div>
              <h2 className="text-base font-medium">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="mb-16 card p-6 sm:p-8">
        <p className="label-mono">// responsible disclosure</p>
        <h2 className="mt-2 text-xl font-medium">Found something? Tell us first.</h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-secondary">
          If you find a vulnerability in Vault Ocean or any tool in the arsenal,
          report it privately before disclosing publicly. We will acknowledge,
          fix, and credit you — and the report itself earns fathoms. A formal
          policy and security.txt land alongside public launch.
        </p>
        <p className="mt-4 font-mono text-sm text-tide">security@vaultocean.com</p>
        <p className="mt-2 font-mono text-[11px] text-ink-muted">
          Security disclosure policy also available at{" "}
          <span className="text-tide">/.well-known/security.txt</span>
        </p>
      </section>
    </>
  );
}
