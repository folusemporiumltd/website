import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function splitName(fullName?: string | null) {
  const clean = (fullName || '').trim().replace(/\s+/g, ' ')
  if (!clean) return {}
  const parts = clean.split(' ')
  return parts.length === 1
    ? { FNAME: parts[0] }
    : { FNAME: parts[0], LNAME: parts.slice(1).join(' ') }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : null
    const source = typeof body?.source === 'string' && body.source.trim() ? body.source.trim().slice(0, 80) : 'website'

    if (!email || email.length > 320 || !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: existingSubscriber } = await supabase
      .from('newsletter_subscribers')
      .select('status, welcome_email_sent_at')
      .eq('email', email)
      .maybeSingle()
    const shouldSendWelcome = !existingSubscriber?.welcome_email_sent_at && existingSubscriber?.status !== 'subscribed'

    const { error: subscribeError } = await supabase.rpc('subscribe_newsletter', {
      p_email: email,
      p_full_name: fullName,
      p_source: source,
    })

    if (subscribeError) {
      console.error('Newsletter subscription failed', subscribeError)
      return NextResponse.json({ ok: false, error: 'Subscription could not be completed. Please try again.' }, { status: 400 })
    }

    const apiKey = process.env.BREVO_API_KEY
    const listId = Number(process.env.BREVO_NEWSLETTER_LIST_ID || '2')

    if (!apiKey) {
      console.warn('BREVO_API_KEY is not configured. Newsletter subscriber saved in Supabase only.')
      await supabase
        .from('newsletter_subscribers')
        .update({ brevo_sync_error: 'BREVO_API_KEY is not configured' })
        .eq('email', email)
      return NextResponse.json({ ok: true, syncedToBrevo: false })
    }

    const payload: Record<string, unknown> = {
      email,
      listIds: Number.isFinite(listId) && listId > 0 ? [listId] : [2],
      updateEnabled: true,
    }
    const attributes = splitName(fullName)
    if (Object.keys(attributes).length) payload.attributes = attributes

    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    if (!brevoResponse.ok) {
      const detail = (await brevoResponse.text()).slice(0, 500)
      console.error('Brevo newsletter sync failed', brevoResponse.status, detail)
      await supabase.from('newsletter_subscribers').update({ brevo_sync_error: `Brevo ${brevoResponse.status}: ${detail}`.slice(0, 1000) }).eq('email', email)
      return NextResponse.json({ ok: true, syncedToBrevo: false })
    }

    await supabase.from('newsletter_subscribers').update({ brevo_synced_at: new Date().toISOString(), brevo_sync_error: null }).eq('email', email)

    let welcomeEmailSent = false
    if (shouldSendWelcome) {
      const templateId = Number(process.env.BREVO_NEWSLETTER_WELCOME_TEMPLATE_ID || '18')
      const welcomeResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({ to: [{ email }], templateId: Number.isFinite(templateId) && templateId > 0 ? templateId : 18 }),
        cache: 'no-store',
      })

      if (welcomeResponse.ok) {
        welcomeEmailSent = true
        await supabase.from('newsletter_subscribers').update({ welcome_email_sent_at: new Date().toISOString(), welcome_email_error: null }).eq('email', email)
      } else {
        const detail = (await welcomeResponse.text()).slice(0, 500)
        console.error('Brevo newsletter welcome email failed', welcomeResponse.status, detail)
        await supabase.from('newsletter_subscribers').update({ welcome_email_error: `Brevo ${welcomeResponse.status}: ${detail}`.slice(0, 1000) }).eq('email', email)
      }
    }

    return NextResponse.json({ ok: true, syncedToBrevo: true, welcomeEmailSent })
  } catch (error) {
    console.error('Newsletter subscribe route error', error)
    return NextResponse.json({ ok: false, error: 'Subscription could not be completed. Please try again.' }, { status: 500 })
  }
}
