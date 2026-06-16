/**
 * Console module registry (navigation). Every module listed here is a REAL,
 * working page backed by your actual scan data — no mock/demo modules.
 */

export type Severity = "critical" | "high" | "medium" | "low";

export const MODULES = [
  { slug: "overview", label: "Overview", group: "main" },
  { slug: "surface", label: "Attack Surface", group: "main" },
  { slug: "assets", label: "Assets", group: "main" },
  { slug: "vulnerabilities", label: "Vulnerabilities", group: "main" },
  { slug: "reports", label: "Reports", group: "intel" },
] as const;
