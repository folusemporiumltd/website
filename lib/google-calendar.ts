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

const PROVIDER = 'google_calendar'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

async function getConnections(): Promise<IntegrationRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('ai_agent_integrations').select('id,provider,account_key,status,access_token,refresh_token,scope,expires_at,metadata').eq('provider', PROVIDER).order('created_at',{ascending:true}).limit(2)
  if (error) throw error
  return (data || []) as IntegrationRow[]
}

async function refreshAccessToken(row: IntegrationRow): Promise<IntegrationRow> {
  if (!row.refresh_token) throw new Error(`Google Calendar refresh token is unavailable for ${row.metadata?.email || row.account_key}. Reconnect Calendar.`)
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Google OAuth server credentials are not configured.')

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: row.refresh_token, grant_type: 'refresh_token' }),
    cache: 'no-store',
  })
  const token = await response.json()
  if (!response.ok || !token.access_token) {
    const message = token?.error_description || token?.error || 'Google Calendar token refresh failed.'
    const admin = createAdminClient()
    await admin.from('ai_agent_integrations').update({ status: 'error', last_error: String(message), updated_at: new Date().toISOString() }).eq('id', row.id)
    throw new Error(String(message))
  }

  const expiresIn = Number(token.expires_in || 3600)
  const admin = createAdminClient()
  const { data, error } = await admin.from('ai_agent_integrations').update({
    access_token: String(token.access_token),
    expires_at: new Date(Date.now() + Math.max(60, expiresIn - 60) * 1000).toISOString(),
    status: 'active',
    last_error: null,
    updated_at: new Date().toISOString(),
  }).eq('id', row.id).select('id,provider,account_key,status,access_token,refresh_token,scope,expires_at,metadata').single()
  if (error) throw error
  return data as IntegrationRow
}

async function activeConnection(row: IntegrationRow): Promise<IntegrationRow> {
  if (row.status !== 'active' || !row.access_token) return row
  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0
  if (!expiresAt || expiresAt <= Date.now() + 30_000) return refreshAccessToken(row)
  return row
}

export async function getGoogleCalendarConnectionStatus() {
  const rows = await getConnections()
  const accounts = rows.map(row => ({
    id: row.id,
    email: row.metadata?.email || row.account_key || null,
    connected: Boolean(row.status === 'active' && row.access_token),
    status: row.status,
    scope: row.scope || null,
    expiresAt: row.expires_at || null,
  }))
  return {
    connected: accounts.some(a => a.connected),
    status: accounts.length ? (accounts.some(a => a.status === 'error') ? 'error' : 'active') : 'disconnected',
    accounts,
    count: accounts.length,
    canAddMore: accounts.length < 2,
  }
}

async function fetchAccountSnapshot(rowInput: IntegrationRow) {
  const row = await activeConnection(rowInput)
  const email = row.metadata?.email || row.account_key || null
  if (row.status !== 'active' || !row.access_token) return { connected:false, email, upcoming_events:[] }

  const now = new Date()
  const horizon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: horizon.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '25',
  })
  const response = await fetch(`${CALENDAR_API}/calendars/primary/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${row.access_token}` },
    cache: 'no-store',
  })
  const json = await response.json()
  if (!response.ok) throw new Error(json?.error?.message || `Google Calendar request failed for ${email || 'account'}.`)

  const events = (Array.isArray(json?.items) ? json.items : []).map((event:any) => ({
    id: event.id,
    summary: event.summary || 'Untitled event',
    description: event.description || null,
    location: event.location || null,
    start: event.start?.dateTime || event.start?.date || null,
    end: event.end?.dateTime || event.end?.date || null,
    status: event.status || null,
    organizer: event.organizer?.email || null,
    attendees: Array.isArray(event.attendees) ? event.attendees.slice(0,10).map((a:any)=>({email:a.email||null,response_status:a.responseStatus||null})) : [],
  }))

  return { connected:true, email, upcoming_events:events }
}

export async function fetchGoogleCalendarSnapshot() {
  const rows = await getConnections()
  if (!rows.length) return { connected:false, accounts:[], total_upcoming_events:0 }
  const accounts = await Promise.all(rows.map(row => fetchAccountSnapshot(row).catch(error => ({
    connected:false,
    email:row.metadata?.email || row.account_key || null,
    upcoming_events:[],
    error:error instanceof Error ? error.message : 'Google Calendar unavailable.',
  }))))
  return {
    connected: accounts.some(a => a.connected),
    accounts,
    total_upcoming_events: accounts.reduce((sum,a) => sum + Number(a.upcoming_events?.length || 0), 0),
  }
}
