import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ENDPOINT_TOKEN_HASH = '158c5fa80f9ef0365a611611ed02ed4743b112ebe80808c01743ba8510bfc8ec'

function safeEqual(a: Buffer, b: Buffer) {
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function verifyEndpointToken(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || ''
  const actual = crypto.createHash('sha256').update(token).digest('hex')
  return safeEqual(Buffer.from(actual), Buffer.from(ENDPOINT_TOKEN_HASH))
}

function verifySvix(body: string, headers: Headers, secret: string) {
  const id = headers.get('svix-id')
  const timestamp = headers.get('svix-timestamp')
  const signatureHeader = headers.get('svix-signature')
  if (!id || !timestamp || !signatureHeader) return false

  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false

  const rawSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret
  let key: Buffer
  try { key = Buffer.from(rawSecret, 'base64') } catch { return false }
  const signed = `${id}.${timestamp}.${body}`
  const expected = crypto.createHmac('sha256', key).update(signed).digest()

  return signatureHeader.split(' ').some((part) => {
    const [version, value] = part.split(',')
    if (version !== 'v1' || !value) return false
    try { return safeEqual(expected, Buffer.from(value, 'base64')) } catch { return false }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signingSecret = process.env.RESEND_WEBHOOK_SECRET
  const signatureValid = Boolean(signingSecret && verifySvix(body, request.headers, signingSecret))
  const endpointTokenValid = verifyEndpointToken(request)
  if (!signatureValid && !endpointTokenValid) {
    return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 })
  }

  let event: any
  try { event = JSON.parse(body) } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const supported = new Set([
    'email.sent','email.delivered','email.opened','email.clicked','email.bounced',
    'email.complained','email.failed','email.suppressed','email.delivery_delayed',
  ])
  if (!supported.has(event?.type)) return NextResponse.json({ ok: true, ignored: true })

  const data = event?.data ?? {}
  const tags = Array.isArray(data.tags) ? data.tags : []
  const campaignTag = tags.find((tag: any) => tag?.name === 'campaign_id')?.value
  const recipient = Array.isArray(data.to) ? data.to[0] : data.to

  const supabase = createAdminClient()
  const { error } = await supabase.from('newsletter_events').upsert({
    resend_event_id: event.id ?? `${event.type}:${data.email_id ?? data.id ?? ''}:${event.created_at ?? ''}`,
    resend_email_id: data.email_id ?? data.id ?? null,
    event_type: event.type,
    recipient_email: recipient ?? null,
    subject: data.subject ?? null,
    campaign_id: campaignTag || null,
    event_at: event.created_at ?? new Date().toISOString(),
    payload: event,
  }, { onConflict: 'resend_event_id', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: 'Database insert failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
