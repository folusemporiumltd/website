import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://boaaiskncrfmaismhqno.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_SQQVr7OX77UswU1WadKsSA_dSV1jeNi'

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
 * Server-only catalogue client. When the service-role key is configured in Vercel,
 * this client bypasses RLS for public catalogue reads. If it is not configured,
 * fall back to the normal publishable-key client so the public shop never crashes.
 */
export async function createCatalogueClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceRoleKey) {
    return createSupabaseClient(SUPABASE_URL, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  return createClient()
}
