import Link from 'next/link'
import { login, signup } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; message?: string; mode?: string }> }) {
  const params = await searchParams
  const next = params.next ?? '/account'
  const isCheckout = next === '/checkout'
  const mode = params.mode === 'signup' ? 'signup' : 'signin'

  return (
    <main>
      <section className="section">
        <div className="container" style={{ maxWidth: 680 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo" style={{ width: 58, height: 58, objectFit: 'contain' }} />
            <div><strong style={{ color: 'var(--burgundy)', fontSize: 18 }}>FOLUS EMPORIUM</strong><div className="muted">Nature’s Goodness, Purely Yours.</div></div>
          </div>

          <div className="eyebrow">{isCheckout ? 'Secure checkout' : 'Customer account'}</div>
          <h1>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
          <p>
            {mode === 'signup'
              ? 'Create your Folus Emporium account. We will send a confirmation email before you can sign in and continue to checkout.'
              : isCheckout
                ? 'Sign in to continue from your cart to the secure Paystack payment step.'
                : 'Sign in to access your Folus Emporium account.'}
          </p>

          {params.error && <p role="alert" style={{ color: 'var(--burgundy)' }}>{params.error}</p>}
          {params.message && <p>{params.message}</p>}

          {mode === 'signup' ? (
            <form>
              <label htmlFor="name">Full name</label>
              <input id="name" name="name" type="text" autoComplete="name" placeholder="Your full name" required />
              <label htmlFor="phone">Phone number</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="0800 000 0000" required />
              <label htmlFor="address">Delivery address</label>
              <textarea id="address" name="address" autoComplete="street-address" placeholder="House number, street, area" rows={4} required />
              <label htmlFor="city">City</label>
              <input id="city" name="city" type="text" autoComplete="address-level2" placeholder="Your city" required />
              <label htmlFor="state">State</label>
              <input id="state" name="state" type="text" autoComplete="address-level1" placeholder="Your state" required />
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required />
              <input type="hidden" name="next" value={next} />
              <button className="btn btn-primary auth-action-btn" formAction={signup}>Create account</button>
            </form>
          ) : (
            <form>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required />
              <input type="hidden" name="next" value={next} />
              <button className="btn btn-primary auth-action-btn" formAction={login}>Sign in and continue</button>
            </form>
          )}

          {mode === 'signin' && <p style={{ marginTop: 16 }}><Link className="auth-switch-btn" href="/reset-password">Forgot your password?</Link></p>}
          <p style={{ marginTop: 20 }}>
            {mode === 'signup' ? (
              <>Already have an account? <Link className="auth-switch-btn" href={`/login?next=${encodeURIComponent(next)}&mode=signin`}>Sign in</Link></>
            ) : (
              <>New to Folus Emporium? <Link className="auth-switch-btn" href={`/login?next=${encodeURIComponent(next)}&mode=signup`}>Create an account</Link></>
            )}
          </p>
        </div>
      </section>
    </main>
  )
}
