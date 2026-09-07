import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// These are the public Supabase project values for Folus Emporium.
// The publishable key is safe to use in browser/server public-data queries.
// Sensitive service-role credentials are intentionally NOT hardcoded.
const SUPABASE_URL = 'https://boaaiskncrfmaismhqno.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_SQQVr7OX77UswU1WadKsSA_dSV1jeNi'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet, _headers) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Cookie writes from Server Components are handled by proxy.ts.
          }
        },
      },
    }
  )
}

/**
 * Public catalogue client.
 *
 * Catalogue reads intentionally use the publishable key because the database
 * RLS policies permit anonymous reads of active catalogue records. This also
 * prevents a stale/invalid Vercel service-role environment variable from
 * taking the public Shop/Home pages offline.
 */
export async function createCatalogueClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
