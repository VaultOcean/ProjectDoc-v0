/**
 * Supabase access points.
 *
 * Intentionally dependency-light for the foundation: we expose a typed config
 * and a guard so the app runs with zero backend configured. Wire the real
 * `@supabase/ssr` clients here once a project exists — the call sites already
 * branch on `isSupabaseConfigured()`.
 */

export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseConfig.url && supabaseConfig.anonKey);
}
