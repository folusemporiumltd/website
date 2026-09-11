'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const PUBLIC_SITE_URL = 'https://website-smoky-kappa-22.vercel.app'

function safeNext(value: string) {
  return value.startsWith('/') && !value.startsWith('//') ? value : '/account'
}

function getPublicOrigin(host: string | null, protocol: string) {
  const forwardedHost = host?.split(',')[0]?.trim()
  if (forwardedHost && !forwardedHost.startsWith('localhost:') && forwardedHost !== 'localhost') {
    return `${protocol === 'https' ? 'https' : 'http'}://${forwardedHost}`
  }
  return process.env.NEXT_PUBLIC_SITE_URL || PUBLIC_SITE_URL
}

async function sendCustomerWelcomeEmail(email: string) {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.warn('BREVO_API_KEY is not configured. Customer welcome email was not sent.')
    return
  }

  const configuredTemplateId = Number(process.env.BREVO_CUSTOMER_WELCOME_TEMPLATE_ID || '25')
  const templateId = Number.isFinite(configuredTemplateId) && configuredTemplateId > 0 ? configuredTemplateId : 25

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      to: [{ email }],
      templateId,
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500)
    console.error('Brevo customer welcome email failed', response.status, detail)
  }
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = safeNext(String(formData.get('next') ?? '/account'))

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}&mode=signin`)

  let destination = next
  if (next === '/account' && data.user?.id) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    if (profile?.role === 'admin') destination = '/admin/dashboard'
  }

  revalidatePath('/', 'layout')
  redirect(destination)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const fullName = String(formData.get('name') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const address = String(formData.get('address') ?? '').trim()
  const city = String(formData.get('city') ?? '').trim()
  const state = String(formData.get('state') ?? '').trim()
  const newsletterConsent = formData.get('newsletter_consent') === 'on'
  const next = safeNext(String(formData.get('next') ?? '/account'))
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https'
  const origin = getPublicOrigin(host, protocol)
  const confirmationUrl = `${origin}/auth/callback?next=${encodeURIComponent(next)}`

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: confirmationUrl,
      data: {
        full_name: fullName,
        phone,
        delivery_address: address,
        delivery_city: city,
        delivery_state: state,
      },
    },
  })

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}&mode=signup`)

  const isNewAccount = Array.isArray(data.user?.identities) && data.user.identities.length > 0
  if (isNewAccount) {
    try {
      await sendCustomerWelcomeEmail(email)
    } catch (welcomeError) {
      console.error('Customer welcome email error', welcomeError)
    }
  }

  if (newsletterConsent) {
    await supabase.rpc('subscribe_newsletter', { p_email: email, p_full_name: fullName, p_source: 'registration' })
  }

  if (data.session) {
    revalidatePath('/', 'layout')
    redirect(next)
  }

  redirect(`/login?message=${encodeURIComponent('Account created. We sent a confirmation link to your email. After confirming it, you will return here to sign in and continue your checkout.')}&next=${encodeURIComponent(next)}&mode=signin`)
}
