import type { Metadata } from "next";
import { ConsoleShell } from "@/components/console/console-shell";

export const metadata: Metadata = {
  title: "VaultOcean Console",
  description: "See your entire attack surface as one living ocean.",
};

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleShell>{children}</ConsoleShell>;
}
