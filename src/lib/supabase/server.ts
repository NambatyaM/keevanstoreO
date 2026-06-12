// ============================================================
// Supabase Server Client (with cookie handling)
// ============================================================
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured =
  SUPABASE_URL &&
  SUPABASE_URL !== "mock" &&
  SUPABASE_URL !== "" &&
  SUPABASE_ANON_KEY &&
  SUPABASE_ANON_KEY !== "mock" &&
  SUPABASE_ANON_KEY !== "";

export async function createServerSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  });
}

/**
 * Creates a Supabase client using the service role key.
 * This bypasses Row Level Security (RLS) and should only be used for:
 * - Creating creator profiles during signup (before the user has authenticated RLS access)
 * - Admin operations
 * - Payment webhook processing (IPN handler)
 * - Any server-side operation that needs to bypass RLS
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

export async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
