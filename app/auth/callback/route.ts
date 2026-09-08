import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://boaaiskncrfmaismhqno.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_SQQVr7OX77UswU1WadKsSA_dSV1jeNi'

function safeNext(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/account'
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = safeNext(url.searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent('The email confirmation link is missing or invalid.')}&next=${encodeURIComponent(next)}&mode=signin`, url.origin))
  }

  const successDestination = next.startsWith('/reset-password')
    ? next
    : `/login?message=${encodeURIComponent('Email confirmed successfully. Please sign in to continue your checkout.')}&next=${encodeURIComponent(next)}&mode=signin`

  // The exchange creates the recovery session. Attach its Set-Cookie values to
  // the exact redirect response returned to the browser, so updateUser() can
  // authenticate the password change on the reset page.
  const response = NextResponse.redirect(new URL(successDestination, url.origin))
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent('We could not confirm your email. Please request a new confirmation email and try again.')}&next=${encodeURIComponent(next)}&mode=signin`, url.origin))
  }

  return response
}
