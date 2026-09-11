import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = 'https://boaaiskncrfmaismhqno.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_SQQVr7OX77UswU1WadKsSA_dSV1jeNi'

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  )
}
