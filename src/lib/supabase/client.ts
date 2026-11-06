import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for client-side components.
 * Safely handles cases where Supabase credentials are not yet configured.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Return a dummy client in dev if credentials are not configured
    return createBrowserClient(
      "https://placeholder-project.supabase.co",
      "placeholder-anon-key"
    );
  }

  return createBrowserClient(url, anonKey);
}

export const supabaseClient = typeof window !== "undefined" ? createClient() : null;
