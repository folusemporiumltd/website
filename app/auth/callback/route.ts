import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function safeNext(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/account'
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = safeNext(url.searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent('The email confirmation link is missing or invalid.')}&next=${encodeURIComponent(next)}&mode=signin`, url.origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent('We could not confirm your email. Please request a new confirmation email and try again.')}&next=${encodeURIComponent(next)}&mode=signin`, url.origin))
  }

  return NextResponse.redirect(new URL(`/login?message=${encodeURIComponent('Email confirmed successfully. Please sign in to continue your checkout.')}&next=${encodeURIComponent(next)}&mode=signin`, url.origin))
}
