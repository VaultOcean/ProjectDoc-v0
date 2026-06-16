import Link from "next/link";
import { Wordmark, GithubIcon } from "@/components/brand";
import { PILLARS } from "@/lib/content";
import { getTools } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";

export async function SiteFooter() {
  const [tools, user] = await Promise.all([getTools(), getCurrentUser()]);

  const projectLinks = [
    { href: "/security",                    label: "Security" },
    { href: "/console",                     label: "Console (Pro)" },
    user
      ? { href: "/workspace",  label: "Draft" }
      : { href: "/login",      label: "Sign in" },
    { href: "https://github.com/0x595",    label: "GitHub", external: true },
  ];

  return (
    <footer className="mt-24 border-t border-hair">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.6fr_1fr_1fr_1fr]">

        {/* Brand */}
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-secondary">
            An open community for ethical hackers and security tool builders.
            Field · Lab · Arsenal · Draft — one profile, one streak.
          </p>
          <a
            href="https://github.com/0x595"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-tide"
          >
            <GithubIcon className="h-4 w-4" />
            Source on GitHub
          </a>
        </div>

        <FooterCol
          title="Explore"
          links={PILLARS.map((p) => ({ href: `/${p.slug}`, label: p.name }))}
        />
        <FooterCol
          title="Arsenal"
          links={tools.map((t) => ({ href: `/tools/${t.slug}`, label: t.name }))}
        />
        <FooterCol title="Project" links={projectLinks} />
      </div>

      {/* Bottom bar */}
      <div className="border-t border-hair">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-4 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-mono">
            © {new Date().getFullYear()} Vault Ocean · vaultocean.com
          </span>
          <span className="font-mono tracking-wide">
            built in the deep
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string; external?: boolean }[];
}) {
  return (
    <div>
      <h3 className="label-mono mb-4">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-ink-secondary transition-colors hover:text-tide"
              {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
