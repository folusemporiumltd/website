'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const PUBLIC_SITE_URL = 'https://website-smoky-kappa-22.vercel.app'

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) redirect('/reset-password?error=Enter+your+email+address.')

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Recovery links must land on the reset page itself. It can establish a
    // session from either a PKCE code or an implicit-flow URL fragment. Going
    // through the email-confirmation callback loses the fragment and caused
    // valid recovery links to be reported as failed confirmations.
    redirectTo: `${PUBLIC_SITE_URL}/reset-password?mode=update`,
  })

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent('We could not send the password email. Please try again.')}`)
  }

  redirect('/reset-password?message=If+that+email+has+an+account%2C+a+secure+password+link+has+been+sent.')
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirm_password') ?? '')

  if (password.length < 8) {
    redirect('/reset-password?mode=update&error=Choose+a+password+with+at+least+8+characters.')
  }
  if (password !== confirmPassword) {
    redirect('/reset-password?mode=update&error=The+passwords+do+not+match.')
  }

  const supabase = await createClient()

  // A recovery link must have established a real authenticated recovery session.
  // Verify that session server-side before attempting the sensitive password change.
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    redirect('/reset-password?error=Your+secure+password+session+is+missing+or+has+expired.+Please+request+a+new+reset+email.')
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect(`/reset-password?mode=update&error=${encodeURIComponent(error.message || 'We could not update your password. Please request a new reset email and try again.')}`)
  }

  await supabase.auth.signOut()
  redirect('/login?mode=signin&message=Password+updated+successfully.+Please+sign+in+with+your+new+password.&next=%2Fadmin')
}
