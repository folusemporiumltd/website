import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PROVIDER = 'google_gmail'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return NextResponse.redirect(new URL('/login?next=/admin/assistant&mode=signin', request.url))
  const { data: isAdmin, error: adminError } = await supabase.rpc('get_my_admin_status')
  if (adminError || isAdmin !== true) return NextResponse.redirect(new URL('/account?admin_error=access', request.url))

  const returnedState = request.nextUrl.searchParams.get('state') || ''
  const cookieState = request.cookies.get('folus_google_gmail_oauth_state')?.value || ''
  const code = request.nextUrl.searchParams.get('code') || ''
  const oauthError = request.nextUrl.searchParams.get('error') || ''
  if (oauthError) return NextResponse.redirect(new URL(`/admin/assistant?gmail=error&reason=${encodeURIComponent(oauthError)}`, request.url))
  if (!code || !returnedState || returnedState !== cookieState) return NextResponse.redirect(new URL('/admin/assistant?gmail=invalid_state', request.url))

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return NextResponse.redirect(new URL('/admin/assistant?gmail=credentials_required', request.url))

  const redirectUri = `${request.nextUrl.origin}/api/admin/integrations/google/gmail/callback`
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    cache: 'no-store',
  })
  const token = await tokenResponse.json()
  if (!tokenResponse.ok || !token.access_token) {
    const reason = token?.error_description || token?.error || 'token_exchange_failed'
    return NextResponse.redirect(new URL(`/admin/assistant?gmail=error&reason=${encodeURIComponent(String(reason))}`, request.url))
  }

  let email: string | null = null
  try {
    const profileResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', { headers: { Authorization: `Bearer ${token.access_token}` }, cache: 'no-store' })
    const profile = await profileResponse.json()
    if (profileResponse.ok) email = profile?.emailAddress || null
  } catch {}

  const admin = createAdminClient()
  const { data: existing } = await admin.from('ai_agent_integrations').select('refresh_token,metadata').eq('provider', PROVIDER).maybeSingle()
  const expiresIn = Number(token.expires_in || 3600)
  const now = new Date()
  const { error } = await admin.from('ai_agent_integrations').upsert({
    provider: PROVIDER,
    status: 'active',
    access_token: String(token.access_token),
    refresh_token: token.refresh_token ? String(token.refresh_token) : existing?.refresh_token || null,
    api_domain: 'https://gmail.googleapis.com',
    scope: String(token.scope || 'https://www.googleapis.com/auth/gmail.readonly'),
    expires_at: new Date(now.getTime() + Math.max(60, expiresIn - 60) * 1000).toISOString(),
    connected_by: authData.user.id,
    metadata: { ...(existing?.metadata || {}), email, connected_at: now.toISOString() },
    last_error: null,
    updated_at: now.toISOString(),
  }, { onConflict: 'provider' })
  if (error) return NextResponse.redirect(new URL('/admin/assistant?gmail=storage_error', request.url))

  await supabase.from('ai_agent_activity').insert({ actor_user_id: authData.user.id, event_type: 'integration_connected', summary: 'Gmail connected to Folus VA.', metadata: { provider: PROVIDER, email } })
  const response = NextResponse.redirect(new URL('/admin/assistant?gmail=connected', request.url))
  response.cookies.set('folus_google_gmail_oauth_state', '', { httpOnly: true, path: '/', maxAge: 0 })
  return response
}
