import { createAdminClient } from '@/lib/supabase/admin'

type IntegrationRow = {
  id: string
  provider: string
  account_key: string
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

async function getConnections(): Promise<IntegrationRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('ai_agent_integrations').select('id,provider,account_key,status,access_token,refresh_token,scope,expires_at,metadata').eq('provider', PROVIDER).order('created_at',{ascending:true}).limit(2)
  if (error) throw error
  return (data || []) as IntegrationRow[]
}

async function refreshAccessToken(row: IntegrationRow): Promise<IntegrationRow> {
  if (!row.refresh_token) throw new Error(`Gmail refresh token is unavailable for ${row.metadata?.email || row.account_key}. Reconnect Gmail.`)
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Google OAuth server credentials are not configured.')
  const response = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: row.refresh_token, grant_type: 'refresh_token' }), cache: 'no-store' })
  const token = await response.json()
  if (!response.ok || !token.access_token) {
    const message = token?.error_description || token?.error || 'Google token refresh failed.'
    const admin = createAdminClient()
    await admin.from('ai_agent_integrations').update({ status: 'error', last_error: String(message), updated_at: new Date().toISOString() }).eq('id', row.id)
    throw new Error(String(message))
  }
  const expiresIn = Number(token.expires_in || 3600)
  const admin = createAdminClient()
  const { data, error } = await admin.from('ai_agent_integrations').update({ access_token: String(token.access_token), expires_at: new Date(Date.now() + Math.max(60, expiresIn - 60) * 1000).toISOString(), status: 'active', last_error: null, updated_at: new Date().toISOString() }).eq('id', row.id).select('id,provider,account_key,status,access_token,refresh_token,scope,expires_at,metadata').single()
  if (error) throw error
  return data as IntegrationRow
}

async function activeConnection(row: IntegrationRow): Promise<IntegrationRow> {
  if (row.status !== 'active' || !row.access_token) return row
  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0
  if (!expiresAt || expiresAt <= Date.now() + 30_000) return refreshAccessToken(row)
  return row
}

function headerValue(headers: any[], name: string) {
  const hit = headers.find(h => String(h?.name || '').toLowerCase() === name.toLowerCase())
  return hit?.value || null
}

export async function getGmailConnectionStatus() {
  const rows = await getConnections()
  const accounts = rows.map(row => ({ id: row.id, email: row.metadata?.email || row.account_key || null, connected: Boolean(row.status === 'active' && row.access_token), status: row.status, scope: row.scope || null, expiresAt: row.expires_at || null }))
  return { connected: accounts.some(a => a.connected), status: accounts.length ? (accounts.some(a => a.status === 'error') ? 'error' : 'active') : 'disconnected', accounts, count: accounts.length, canAddMore: accounts.length < 2 }
}

async function fetchAccountSnapshot(rowInput: IntegrationRow) {
  const row = await activeConnection(rowInput)
  const emailHint = row.metadata?.email || row.account_key || null
  if (row.status !== 'active' || !row.access_token) return { connected: false, email: emailHint, unread_count: 0, recent_messages: [] }
  const headers = { Authorization: `Bearer ${row.access_token}` }
  const [profileResponse, unreadResponse, recentResponse] = await Promise.all([
    fetch(`${GMAIL_API}/users/me/profile`, { headers, cache: 'no-store' }),
    fetch(`${GMAIL_API}/users/me/messages?q=is%3Aunread&maxResults=20`, { headers, cache: 'no-store' }),
    fetch(`${GMAIL_API}/users/me/messages?maxResults=12`, { headers, cache: 'no-store' }),
  ])
  const profile = await profileResponse.json(), unread = await unreadResponse.json(), recent = await recentResponse.json()
  if (!profileResponse.ok) throw new Error(profile?.error?.message || `Gmail profile request failed for ${emailHint || 'account'}.`)
  if (!unreadResponse.ok) throw new Error(unread?.error?.message || `Gmail unread-message request failed for ${emailHint || 'account'}.`)
  if (!recentResponse.ok) throw new Error(recent?.error?.message || `Gmail message-list request failed for ${emailHint || 'account'}.`)
  const ids = Array.isArray(recent?.messages) ? recent.messages.slice(0, 12) : []
  const details = await Promise.all(ids.map(async (m:any) => {
    const response = await fetch(`${GMAIL_API}/users/me/messages/${encodeURIComponent(m.id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`, { headers, cache: 'no-store' })
    const json = await response.json()
    if (!response.ok) return null
    const hs = Array.isArray(json?.payload?.headers) ? json.payload.headers : []
    return { id: json.id, thread_id: json.threadId, from: headerValue(hs,'From'), to: headerValue(hs,'To'), subject: headerValue(hs,'Subject'), date: headerValue(hs,'Date'), snippet: json.snippet || '', label_ids: json.labelIds || [] }
  }))
  const email = profile?.emailAddress || emailHint
  return { connected: true, email, unread_count: Number(unread?.resultSizeEstimate || 0), recent_messages: details.filter(Boolean) }
}

export async function fetchGmailSnapshot() {
  const rows = await getConnections()
  if (!rows.length) return { connected: false, accounts: [], total_unread_count: 0 }
  const accounts = await Promise.all(rows.map(row => fetchAccountSnapshot(row).catch(error => ({ connected:false, email:row.metadata?.email || row.account_key || null, unread_count:0, recent_messages:[], error:error instanceof Error ? error.message : 'Gmail unavailable.' }))))
  return { connected: accounts.some(a => a.connected), accounts, total_unread_count: accounts.reduce((sum,a) => sum + Number(a.unread_count || 0), 0) }
}
