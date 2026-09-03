'use client'

import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return <button onClick={signOut}>Sign out</button>
}
