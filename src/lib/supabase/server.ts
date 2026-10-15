import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readSupabaseEnv } from "./env";

let cached: SupabaseClient | null | undefined;

export function getSupabaseServer(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const env = readSupabaseEnv();
  if (!env) {
    cached = null;
    return null;
  }
  cached = createClient(env.url, env.serviceRoleKey || env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return cached;
}
