/**
 * Supabase clients for production.
 * Demo mode works without keys. When env is set, probe + helpers are live.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabasePlaceholder = {
  configured: boolean;
  url?: string;
  message: string;
};

export function getSupabaseConfig(): SupabasePlaceholder {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return {
      configured: false,
      message:
        "Supabase env missing. App uses in-memory demo store. Add keys in Vercel → Settings → Environment Variables.",
    };
  }
  return {
    configured: true,
    url,
    message: `Supabase URL configured (${url.replace(/https?:\/\//, "").slice(0, 24)}…)`,
  };
}

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

/** Browser / RLS-scoped client (anon key) */
export function createBrowserSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  if (!browserClient) {
    browserClient = createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return browserClient;
}

/** Server client — prefers service role for admin/webhooks; falls back to anon */
export function createServerSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!serverClient) {
    serverClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serverClient;
}

export async function probeSupabase(): Promise<{ ok: boolean; detail: string }> {
  const cfg = getSupabaseConfig();
  if (!cfg.configured) {
    return {
      ok: false,
      detail: "Skipped — no Supabase env (demo mode is fine until you deploy live multi-tenant DB)",
    };
  }
  const client = createServerSupabase();
  if (!client) {
    return { ok: false, detail: "Client init failed" };
  }
  try {
    // Lightweight REST reachability: hit a table; missing table still proves auth+network if error is schema
    const { error } = await client.from("restaurants").select("id").limit(1);
    if (error) {
      // Table missing = connected but migration not run
      if (
        error.message?.includes("does not exist") ||
        error.code === "42P01" ||
        error.message?.toLowerCase().includes("relation")
      ) {
        return {
          ok: false,
          detail: `Connected to project but schema missing — run SQL migrations. (${error.message})`,
        };
      }
      // Permission / JWT issues
      return {
        ok: false,
        detail: `Supabase responded with error: ${error.message}`,
      };
    }
    return { ok: true, detail: "Connected · restaurants table readable" };
  } catch (e) {
    return {
      ok: false,
      detail: e instanceof Error ? e.message : "Supabase probe failed",
    };
  }
}
