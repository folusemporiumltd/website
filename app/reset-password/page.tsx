import Link from 'next/link'
import { requestPasswordReset, updatePassword } from './actions'

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ mode?: string; error?: string; message?: string }> }) {
  const params = await searchParams
  const isUpdate = params.mode === 'update'

  return (
    <main>
      <section className="section">
        <div className="container" style={{ maxWidth: 680 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo" style={{ width: 58, height: 58, objectFit: 'contain' }} />
            <div><strong style={{ color: 'var(--burgundy)', fontSize: 18 }}>FOLUS EMPORIUM</strong><div className="muted">Nature’s Goodness, Purely Yours.</div></div>
          </div>

          <div className="eyebrow">{isUpdate ? 'Account security' : 'Password reset'}</div>
          <h1>{isUpdate ? 'Set a new password' : 'Reset your password'}</h1>
          <p>{isUpdate ? 'Choose a new password for your Folus Emporium account.' : 'Enter your email address and we will send you a secure link to set a new password.'}</p>

          {params.error && <p role="alert" style={{ color: 'var(--burgundy)' }}>{params.error}</p>}
          {params.message && <p role="status">{params.message}</p>}

          {isUpdate ? (
            <form>
              <label htmlFor="password">New password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
              <label htmlFor="confirm_password">Confirm new password</label>
              <input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" minLength={8} required />
              <button className="btn btn-primary auth-action-btn" formAction={updatePassword}>Save new password</button>
            </form>
          ) : (
            <form>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
              <button className="btn btn-primary auth-action-btn" formAction={requestPasswordReset}>Send password link</button>
            </form>
          )}

          <p style={{ marginTop: 20 }}><Link className="auth-switch-btn" href="/login">Return to sign in</Link></p>
        </div>
      </section>
    </main>
  )
}
