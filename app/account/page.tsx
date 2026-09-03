import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims?.sub) redirect('/login')

  return (
    <main>
      <h1>My Account</h1>
      <p>Welcome back{data.claims.email ? `, ${data.claims.email}` : ''}.</p>
      <p>Your account is protected by Supabase Auth.</p>
      <SignOutButton />
    </main>
  )
}
