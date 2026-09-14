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

const PROVIDER = 'google_drive'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'

async function getConnections(): Promise<IntegrationRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('ai_agent_integrations').select('id,provider,account_key,status,access_token,refresh_token,scope,expires_at,metadata').eq('provider', PROVIDER).order('created_at',{ascending:true}).limit(2)
  if (error) throw error
  return (data || []) as IntegrationRow[]
}

async function refreshAccessToken(row: IntegrationRow): Promise<IntegrationRow> {
  if (!row.refresh_token) throw new Error(`Google Drive refresh token is unavailable for ${row.metadata?.email || row.account_key}. Reconnect Drive.`)
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Google OAuth server credentials are not configured.')
  const response = await fetch(TOKEN_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,refresh_token:row.refresh_token,grant_type:'refresh_token'}),cache:'no-store'})
  const token = await response.json()
  if (!response.ok || !token.access_token) {
    const message = token?.error_description || token?.error || 'Google Drive token refresh failed.'
    const admin = createAdminClient()
    await admin.from('ai_agent_integrations').update({status:'error',last_error:String(message),updated_at:new Date().toISOString()}).eq('id',row.id)
    throw new Error(String(message))
  }
  const expiresIn = Number(token.expires_in || 3600)
  const admin = createAdminClient()
  const { data, error } = await admin.from('ai_agent_integrations').update({access_token:String(token.access_token),expires_at:new Date(Date.now()+Math.max(60,expiresIn-60)*1000).toISOString(),status:'active',last_error:null,updated_at:new Date().toISOString()}).eq('id',row.id).select('id,provider,account_key,status,access_token,refresh_token,scope,expires_at,metadata').single()
  if (error) throw error
  return data as IntegrationRow
}

async function activeConnection(row: IntegrationRow): Promise<IntegrationRow> {
  if (row.status !== 'active' || !row.access_token) return row
  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0
  if (!expiresAt || expiresAt <= Date.now()+30_000) return refreshAccessToken(row)
  return row
}

export async function getGoogleDriveConnectionStatus() {
  const rows = await getConnections()
  const accounts = rows.map(row=>({id:row.id,email:row.metadata?.email||row.account_key||null,connected:Boolean(row.status==='active'&&row.access_token),status:row.status,scope:row.scope||null,expiresAt:row.expires_at||null}))
  return {connected:accounts.some(a=>a.connected),status:accounts.length?(accounts.some(a=>a.status==='error')?'error':'active'):'disconnected',accounts,count:accounts.length,canAddMore:accounts.length<2}
}

async function previewFile(file:any, accessToken:string) {
  try {
    let url:string|null=null
    if (file.mimeType === 'application/vnd.google-apps.document') url = `${DRIVE_API}/files/${encodeURIComponent(file.id)}/export?mimeType=${encodeURIComponent('text/plain')}`
    else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') url = `${DRIVE_API}/files/${encodeURIComponent(file.id)}/export?mimeType=${encodeURIComponent('text/csv')}`
    else if (['text/plain','text/csv','text/markdown','application/json'].includes(file.mimeType)) url = `${DRIVE_API}/files/${encodeURIComponent(file.id)}?alt=media`
    if (!url) return null
    const response = await fetch(url,{headers:{Authorization:`Bearer ${accessToken}`},cache:'no-store'})
    if (!response.ok) return null
    const text = await response.text()
    return text.slice(0,5000)
  } catch { return null }
}

async function fetchAccountSnapshot(rowInput: IntegrationRow) {
  const row = await activeConnection(rowInput)
  const email = row.metadata?.email || row.account_key || null
  if (row.status !== 'active' || !row.access_token) return {connected:false,email,recent_files:[]}
  const params = new URLSearchParams({q:'trashed = false',orderBy:'modifiedTime desc',pageSize:'20',fields:'files(id,name,mimeType,createdTime,modifiedTime,webViewLink,size,owners(displayName,emailAddress))'})
  const response = await fetch(`${DRIVE_API}/files?${params.toString()}`,{headers:{Authorization:`Bearer ${row.access_token}`},cache:'no-store'})
  const json = await response.json()
  if (!response.ok) throw new Error(json?.error?.message || `Google Drive request failed for ${email || 'account'}.`)
  const files = Array.isArray(json?.files) ? json.files.slice(0,20) : []
  let previewsUsed = 0
  const recentFiles = [] as any[]
  for (const file of files) {
    let preview:null|string = null
    if (previewsUsed < 5) {
      preview = await previewFile(file,row.access_token)
      if (preview) previewsUsed += 1
    }
    recentFiles.push({id:file.id,name:file.name||'Untitled file',mime_type:file.mimeType||null,created_time:file.createdTime||null,modified_time:file.modifiedTime||null,web_view_link:file.webViewLink||null,size:file.size||null,owner:Array.isArray(file.owners)&&file.owners[0]?{name:file.owners[0].displayName||null,email:file.owners[0].emailAddress||null}:null,content_preview:preview})
  }
  return {connected:true,email,recent_files:recentFiles}
}

export async function fetchGoogleDriveSnapshot() {
  const rows = await getConnections()
  if (!rows.length) return {connected:false,accounts:[],total_recent_files:0}
  const accounts = await Promise.all(rows.map(row=>fetchAccountSnapshot(row).catch(error=>({connected:false,email:row.metadata?.email||row.account_key||null,recent_files:[],error:error instanceof Error?error.message:'Google Drive unavailable.'}))))
  return {connected:accounts.some(a=>a.connected),accounts,total_recent_files:accounts.reduce((sum,a)=>sum+Number(a.recent_files?.length||0),0)}
}
