/**
 * Static UI configuration that is genuinely structural (navigation, the pillar
 * taxonomy). All real content — tools, writeups, challenges, profiles — now lives
 * in the database and is read through `@/lib/queries`.
 */

import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Flag,
  Wrench,
  GraduationCap,
} from "lucide-react";

export type Pillar = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  status: "live" | "beta" | "soon";
};

export const PILLARS: Pillar[] = [
  {
    slug: "writeups",
    name: "Field",
    tagline: "Read the field",
    description:
      "Real bug-bounty disclosures and technique breakdowns — distilled so you absorb the core method in minutes.",
    icon: BookOpen,
    status: "beta",
  },
  {
    slug: "arena",
    name: "Lab",
    tagline: "Crack the flag",
    description:
      "Hands-on CTF challenges — web, crypto, forensics, reversing. Submit a flag, earn Fathoms.",
    icon: Flag,
    status: "beta",
  },
  {
    slug: "tools",
    name: "Arsenal",
    tagline: "Use & build",
    description:
      "Open security tools — PentX, FILEx, CSPy. Run them, read the source, open a pull request.",
    icon: Wrench,
    status: "live",
  },
  {
    slug: "workspace",
    name: "Draft",
    tagline: "Write & publish",
    description:
      "Block editor for private notes and published research posts. Your blog at vaultocean.com/u/handle.",
    icon: GraduationCap,
    status: "beta",
  },
];
