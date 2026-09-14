import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'

const SCOPES = ['openid','email','https://www.googleapis.com/auth/gmail.readonly'].join(' ')

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return NextResponse.redirect(new URL('/login?next=/admin/assistant&mode=signin', request.url))
  const { data: isAdmin, error } = await supabase.rpc('get_my_admin_status')
  if (error || isAdmin !== true) return NextResponse.redirect(new URL('/account?admin_error=access', request.url))

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return NextResponse.redirect(new URL('/admin/assistant?gmail=credentials_required', request.url))

  const redirectUri = `${request.nextUrl.origin}/api/admin/integrations/google/gmail/callback`
  const state = randomUUID()
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('include_granted_scopes', 'true')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('state', state)

  const response = NextResponse.redirect(url)
  response.cookies.set('folus_google_gmail_oauth_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 10 * 60 })
  return response
}
