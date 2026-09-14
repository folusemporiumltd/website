import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PROVIDER = 'zoho_crm'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return NextResponse.redirect(new URL('/login?next=/admin/assistant&mode=signin', request.url))
  const { data: isAdmin, error: adminError } = await supabase.rpc('get_my_admin_status')
  if (adminError || isAdmin !== true) return NextResponse.redirect(new URL('/account?admin_error=access', request.url))

  const returnedState = request.nextUrl.searchParams.get('state') || ''
  const cookieState = request.cookies.get('folus_zoho_oauth_state')?.value || ''
  const code = request.nextUrl.searchParams.get('code') || ''
  const oauthError = request.nextUrl.searchParams.get('error') || ''
  if (oauthError) return NextResponse.redirect(new URL(`/admin/assistant?zoho=error&reason=${encodeURIComponent(oauthError)}`, request.url))
  if (!code || !returnedState || returnedState !== cookieState) return NextResponse.redirect(new URL('/admin/assistant?zoho=invalid_state', request.url))

  const clientId = process.env.ZOHO_CLIENT_ID
  const clientSecret = process.env.ZOHO_CLIENT_SECRET
  if (!clientId || !clientSecret) return NextResponse.redirect(new URL('/admin/assistant?zoho=credentials_required', request.url))

  const accountsDomain = (process.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.com').replace(/\/$/, '')
  const redirectUri = `${request.nextUrl.origin}/api/admin/integrations/zoho/callback`
  const tokenResponse = await fetch(`${accountsDomain}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
    cache: 'no-store',
  })
  const token = await tokenResponse.json()
  if (!tokenResponse.ok || !token.access_token) {
    const reason = token?.error || token?.message || 'token_exchange_failed'
    return NextResponse.redirect(new URL(`/admin/assistant?zoho=error&reason=${encodeURIComponent(String(reason))}`, request.url))
  }

  const admin = createAdminClient()
  const expiresIn = Number(token.expires_in || 3600)
  const now = new Date()
  const { error } = await admin.from('ai_agent_integrations').upsert({
    provider: PROVIDER,
    status: 'active',
    access_token: String(token.access_token),
    refresh_token: token.refresh_token ? String(token.refresh_token) : null,
    api_domain: String(token.api_domain || 'https://www.zohoapis.com'),
    scope: String(token.scope || ''),
    expires_at: new Date(now.getTime() + Math.max(60, expiresIn - 60) * 1000).toISOString(),
    connected_by: authData.user.id,
    metadata: { accounts_domain: accountsDomain, connected_at: now.toISOString() },
    last_error: null,
    updated_at: now.toISOString(),
  }, { onConflict: 'provider' })

  if (error) return NextResponse.redirect(new URL('/admin/assistant?zoho=storage_error', request.url))

  await supabase.from('ai_agent_activity').insert({
    actor_user_id: authData.user.id,
    event_type: 'integration_connected',
    summary: 'Zoho CRM connected to Folus VA.',
    metadata: { provider: PROVIDER },
  })

  const response = NextResponse.redirect(new URL('/admin/assistant?zoho=connected', request.url))
  response.cookies.set('folus_zoho_oauth_state', '', { httpOnly: true, path: '/', maxAge: 0 })
  return response
}
