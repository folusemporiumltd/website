import { createAdminClient } from '@/lib/supabase/admin'

type IntegrationRow = {
  id: string
  provider: string
  status: string
  access_token: string | null
  refresh_token: string | null
  scope: string | null
  expires_at: string | null
  metadata: Record<string, any> | null
}

const PROVIDER = 'google_gmail'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1'

async function getConnection(): Promise<IntegrationRow | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('ai_agent_integrations').select('id,provider,status,access_token,refresh_token,scope,expires_at,metadata').eq('provider', PROVIDER).maybeSingle()
  if (error) throw error
  return data as IntegrationRow | null
}

async function refreshAccessToken(row: IntegrationRow): Promise<IntegrationRow> {
  if (!row.refresh_token) throw new Error('Gmail refresh token is unavailable. Reconnect Gmail.')
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Google OAuth server credentials are not configured.')
  const response = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: row.refresh_token, grant_type: 'refresh_token' }), cache: 'no-store' })
  const token = await response.json()
  if (!response.ok || !token.access_token) {
    const message = token?.error_description || token?.error || 'Google token refresh failed.'
    const admin = createAdminClient()
    await admin.from('ai_agent_integrations').update({ status: 'error', last_error: String(message), updated_at: new Date().toISOString() }).eq('provider', PROVIDER)
    throw new Error(String(message))
  }
  const expiresIn = Number(token.expires_in || 3600)
  const admin = createAdminClient()
  const { data, error } = await admin.from('ai_agent_integrations').update({ access_token: String(token.access_token), expires_at: new Date(Date.now() + Math.max(60, expiresIn - 60) * 1000).toISOString(), status: 'active', last_error: null, updated_at: new Date().toISOString() }).eq('provider', PROVIDER).select('id,provider,status,access_token,refresh_token,scope,expires_at,metadata').single()
  if (error) throw error
  return data as IntegrationRow
}

async function activeConnection(): Promise<IntegrationRow | null> {
  let row = await getConnection()
  if (!row || row.status !== 'active' || !row.access_token) return row
  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0
  if (!expiresAt || expiresAt <= Date.now() + 30_000) row = await refreshAccessToken(row)
  return row
}

function headerValue(headers: any[], name: string) {
  const hit = headers.find(h => String(h?.name || '').toLowerCase() === name.toLowerCase())
  return hit?.value || null
}

export async function getGmailConnectionStatus() {
  const row = await getConnection()
  return { connected: Boolean(row?.status === 'active' && row.access_token), status: row?.status || 'disconnected', scope: row?.scope || null, expiresAt: row?.expires_at || null, email: row?.metadata?.email || null }
}

export async function fetchGmailSnapshot() {
  const row = await activeConnection()
  if (!row || row.status !== 'active' || !row.access_token) return { connected: false, email: null, unread_count: 0, recent_messages: [] }
  const headers = { Authorization: `Bearer ${row.access_token}` }
  const [profileResponse, unreadResponse, recentResponse] = await Promise.all([
    fetch(`${GMAIL_API}/users/me/profile`, { headers, cache: 'no-store' }),
    fetch(`${GMAIL_API}/users/me/messages?q=is%3Aunread&maxResults=20`, { headers, cache: 'no-store' }),
    fetch(`${GMAIL_API}/users/me/messages?maxResults=12`, { headers, cache: 'no-store' }),
  ])
  const profile = await profileResponse.json(), unread = await unreadResponse.json(), recent = await recentResponse.json()
  if (!profileResponse.ok) throw new Error(profile?.error?.message || 'Gmail profile request failed.')
  if (!unreadResponse.ok) throw new Error(unread?.error?.message || 'Gmail unread-message request failed.')
  if (!recentResponse.ok) throw new Error(recent?.error?.message || 'Gmail message-list request failed.')
  const ids = Array.isArray(recent?.messages) ? recent.messages.slice(0, 12) : []
  const details = await Promise.all(ids.map(async (m:any) => {
    const response = await fetch(`${GMAIL_API}/users/me/messages/${encodeURIComponent(m.id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`, { headers, cache: 'no-store' })
    const json = await response.json()
    if (!response.ok) return null
    const hs = Array.isArray(json?.payload?.headers) ? json.payload.headers : []
    return { id: json.id, thread_id: json.threadId, from: headerValue(hs,'From'), to: headerValue(hs,'To'), subject: headerValue(hs,'Subject'), date: headerValue(hs,'Date'), snippet: json.snippet || '', label_ids: json.labelIds || [] }
  }))
  const email = profile?.emailAddress || row?.metadata?.email || null
  return { connected: true, email, unread_count: Number(unread?.resultSizeEstimate || 0), recent_messages: details.filter(Boolean) }
}
