import { createAdminClient } from '@/lib/supabase/admin'

type IntegrationRow = {
  id: string
  provider: string
  status: string
  access_token: string | null
  refresh_token: string | null
  api_domain: string | null
  scope: string | null
  expires_at: string | null
  metadata: Record<string, any> | null
}

const PROVIDER = 'zoho_crm'
const ACCOUNTS_DOMAIN = (process.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.com').replace(/\/$/, '')

async function getConnection(): Promise<IntegrationRow | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ai_agent_integrations')
    .select('id,provider,status,access_token,refresh_token,api_domain,scope,expires_at,metadata')
    .eq('provider', PROVIDER)
    .maybeSingle()
  if (error) throw error
  return data as IntegrationRow | null
}

async function refreshAccessToken(row: IntegrationRow): Promise<IntegrationRow> {
  if (!row.refresh_token) throw new Error('Zoho CRM refresh token is unavailable. Reconnect Zoho CRM.')
  const clientId = process.env.ZOHO_CLIENT_ID
  const clientSecret = process.env.ZOHO_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Zoho CRM server credentials are not configured.')

  const body = new URLSearchParams({
    refresh_token: row.refresh_token,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  })
  const response = await fetch(`${ACCOUNTS_DOMAIN}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  })
  const token = await response.json()
  if (!response.ok || !token.access_token) {
    const message = token?.error || token?.message || 'Zoho CRM token refresh failed.'
    const admin = createAdminClient()
    await admin.from('ai_agent_integrations').update({ status: 'error', last_error: String(message), updated_at: new Date().toISOString() }).eq('provider', PROVIDER)
    throw new Error(String(message))
  }

  const expiresIn = Number(token.expires_in || 3600)
  const updated = {
    access_token: String(token.access_token),
    api_domain: String(token.api_domain || row.api_domain || 'https://www.zohoapis.com'),
    expires_at: new Date(Date.now() + Math.max(60, expiresIn - 60) * 1000).toISOString(),
    status: 'active',
    last_error: null,
    updated_at: new Date().toISOString(),
  }
  const admin = createAdminClient()
  const { data, error } = await admin.from('ai_agent_integrations').update(updated).eq('provider', PROVIDER).select('id,provider,status,access_token,refresh_token,api_domain,scope,expires_at,metadata').single()
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

async function fetchModule(row: IntegrationRow, module: string, perPage = 50) {
  const apiDomain = (row.api_domain || 'https://www.zohoapis.com').replace(/\/$/, '')
  const response = await fetch(`${apiDomain}/crm/v8/${module}?per_page=${perPage}`, {
    headers: { Authorization: `Zoho-oauthtoken ${row.access_token}` },
    cache: 'no-store',
  })
  if (response.status === 204) return []
  const json = await response.json()
  if (!response.ok) throw new Error(json?.message || json?.code || `Zoho CRM ${module} request failed.`)
  return Array.isArray(json?.data) ? json.data : []
}

export async function getZohoConnectionStatus() {
  const row = await getConnection()
  return {
    connected: Boolean(row?.status === 'active' && row.access_token),
    status: row?.status || 'disconnected',
    scope: row?.scope || null,
    expiresAt: row?.expires_at || null,
  }
}

export async function fetchZohoCrmSnapshot() {
  const row = await activeConnection()
  if (!row || row.status !== 'active' || !row.access_token) {
    return { connected: false, leads: [], contacts: [], deals: [], tasks: [] }
  }

  const [leads, contacts, deals, tasks] = await Promise.all([
    fetchModule(row, 'Leads', 50),
    fetchModule(row, 'Contacts', 50),
    fetchModule(row, 'Deals', 50),
    fetchModule(row, 'Tasks', 50),
  ])

  return {
    connected: true,
    leads: leads.map((r: any) => ({ id: r.id, name: [r.First_Name, r.Last_Name].filter(Boolean).join(' '), company: r.Company, email: r.Email, phone: r.Phone, status: r.Lead_Status, created_time: r.Created_Time })),
    contacts: contacts.map((r: any) => ({ id: r.id, name: [r.First_Name, r.Last_Name].filter(Boolean).join(' '), account: r.Account_Name?.name, email: r.Email, phone: r.Phone, created_time: r.Created_Time })),
    deals: deals.map((r: any) => ({ id: r.id, name: r.Deal_Name, stage: r.Stage, amount: r.Amount, closing_date: r.Closing_Date, contact: r.Contact_Name?.name, account: r.Account_Name?.name, created_time: r.Created_Time })),
    tasks: tasks.map((r: any) => ({ id: r.id, subject: r.Subject, status: r.Status, priority: r.Priority, due_date: r.Due_Date, owner: r.Owner?.name, related_to: r.What_Id?.name })),
  }
}
