import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { CommandPalette } from "@/components/command-palette";
import { SiteChrome } from "@/components/site-chrome";
import { SmoothScroll } from "@/components/smooth-scroll";
import { getCurrentUser } from "@/lib/auth";
import { getEntitledTools } from "@/lib/vault-ocean";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://vaultocean.com"),
  title: {
    default: "Vault Ocean — learn, solve, build security",
    template: "%s · Vault Ocean",
  },
  description:
    "An open security community for ethical hackers and tool builders. Read curated writeups, solve challenges, contribute to real tools — tracked on one Depth profile.",
  applicationName: "Vault Ocean",
  keywords: [
    "ethical hacking",
    "bug bounty",
    "ctf",
    "security writeups",
    "open source security tools",
    "vault ocean",
  ],
  openGraph: {
    title: "Vault Ocean",
    description:
      "Learn. Solve. Build. Showcase. The open security community.",
    type: "website",
    url: "/",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#070b12",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const navUser = user
    ? { handle: user.handle, streakDays: user.streakDays, fathoms: user.fathoms }
    : null;
  const entitledTools = user ? await getEntitledTools(user.id) : [];

  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable} ${serif.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-tide focus:px-3 focus:py-2 focus:text-sm focus:text-abyss-900"
        >
          Skip to content
        </a>
        <SmoothScroll />
        <SiteChrome
          nav={<SiteNav user={navUser} />}
          palette={<CommandPalette handle={navUser?.handle ?? null} loggedIn={!!user} />}
          footer={<SiteFooter />}
          user={navUser}
          entitledTools={entitledTools}
        >
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
