import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminBreadcrumbs from '@/components/admin-breadcrumbs'

const TEST_FROM = 'Folus Emporium <onboarding@resend.dev>'
const TEST_TO = 'delivered@resend.dev'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) redirect('/login?next=/admin/newsletter/test&mode=signin')
  const { data: isAdmin } = await supabase.rpc('get_my_admin_status')
  if (isAdmin !== true) redirect('/account?admin_error=access')
}

async function sendResendTest() {
  'use server'
  await requireAdmin()

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    redirect('/admin/newsletter/test?error=' + encodeURIComponent('RESEND_API_KEY is not available in this Vercel deployment.'))
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: TEST_FROM,
      to: [TEST_TO],
      subject: 'Folus Emporium Resend integration test',
      text: 'Folus Emporium website successfully connected to Resend.',
      html: '<strong>Folus Emporium website successfully connected to Resend.</strong>',
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const result = await response.json().catch(() => null)
    const providerMessage = result?.message || result?.error?.message || 'Resend rejected the test request.'
    redirect('/admin/newsletter/test?error=' + encodeURIComponent(providerMessage))
  }

  redirect('/admin/newsletter/test?message=' + encodeURIComponent('Test accepted by Resend. The Vercel API key is working. No customer email was sent.'))
}

export default async function NewsletterTestPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  await requireAdmin()
  const params = await searchParams

  return (
    <main>
      <header className="nav">
        <div className="container nav-inner">
          <Link className="brand" href="/admin/dashboard">
            <img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo" />
            <span>FOLUS<br />EMPORIUM<small>Admin Dashboard</small></span>
          </Link>
          <nav className="navlinks">
            <Link href="/admin/dashboard">Dashboard</Link>
            <Link href="/admin/newsletter">Newsletter</Link>
            <Link href="/account">Account</Link>
          </nav>
        </div>
      </header>

      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          <AdminBreadcrumbs items={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Newsletter', href: '/admin/newsletter' }, { label: 'Resend test' }]} />
          <div className="eyebrow">Safe integration test</div>
          <h1>Test Resend connection</h1>
          <p className="muted">
            This test uses Resend&apos;s temporary <strong>onboarding@resend.dev</strong> sender and sends only to
            Resend&apos;s test-delivery address. It does not email your customer list.
          </p>

          {params.message ? (
            <p role="status" style={{ background: '#edf8f0', padding: 14, borderRadius: 10, fontWeight: 700 }}>{params.message}</p>
          ) : null}
          {params.error ? (
            <p role="alert" style={{ background: '#fff0f1', color: 'var(--burgundy)', padding: 14, borderRadius: 10, fontWeight: 700 }}>{params.error}</p>
          ) : null}

          <section className="cart-summary" style={{ position: 'static', marginTop: 24 }}>
            <h2>Vercel → Resend test</h2>
            <p className="muted">Click once to verify that the RESEND_API_KEY you added to Vercel is available and accepted by Resend.</p>
            <form action={sendResendTest}>
              <button className="btn btn-primary" type="submit">Send safe test</button>
            </form>
          </section>
        </div>
      </section>
    </main>
  )
}
