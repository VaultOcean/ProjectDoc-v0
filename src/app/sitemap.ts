import type { MetadataRoute } from "next";
import { PILLARS } from "@/lib/content";
import { getTools, getWriteups } from "@/lib/queries";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vaultocean.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/security", "/login"].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
  }));
  const pillars = PILLARS.map((p) => ({ url: `${base}/${p.slug}`, lastModified: new Date() }));

  // Content URLs are best-effort: never let a DB hiccup fail the build.
  try {
    const [tools, writeups] = await Promise.all([getTools(), getWriteups()]);
    const toolUrls = tools.map((t) => ({ url: `${base}/tools/${t.slug}`, lastModified: new Date() }));
    const writeupUrls = writeups.map((w) => ({
      url: `${base}/writeups/${w.slug}`,
      lastModified: new Date(w.date),
    }));
    return [...staticRoutes, ...pillars, ...toolUrls, ...writeupUrls];
  } catch {
    return [...staticRoutes, ...pillars];
  }
}
