import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a privileged Supabase client with the SERVICE_ROLE_KEY.
 * Only use in secure server-side contexts (Route Handlers, cron jobs, seed scripts).
 * NEVER expose this client to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const supabaseAdmin = createAdminClient();

