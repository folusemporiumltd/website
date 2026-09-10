'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Screen = 'request' | 'preparing' | 'update' | 'invalid'

export default function ResetPasswordPage() {
  const [screen, setScreen] = useState<Screen>('request')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestedMode = params.get('mode')
    const urlError = params.get('error')
    const urlMessage = params.get('message')

    if (urlError) setError(urlError)
    if (urlMessage) setMessage(urlMessage)
    if (requestedMode !== 'update') return

    setScreen('preparing')

    const establishRecoverySession = async () => {
      const supabase = createClient()
      const fragment = new URLSearchParams(window.location.hash.slice(1))
      const accessToken = fragment.get('access_token')
      const refreshToken = fragment.get('refresh_token')
      const code = params.get('code')

      let recoveryError: Error | null = null

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        recoveryError = error
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        recoveryError = error
      } else {
        const { data, error } = await supabase.auth.getSession()
        recoveryError = error ?? (data.session ? null : new Error('Missing recovery session'))
      }

      if (recoveryError) {
        setError('This password link is invalid or has expired. Request a fresh link below.')
        setScreen('invalid')
        return
      }

      window.history.replaceState(null, '', '/reset-password?mode=update')
      setScreen('update')
    }

    void establishRecoverySession()
  }, [])

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')
    const confirmPassword = String(form.get('confirm_password') ?? '')

    setError('')
    if (password.length < 8) { setError('Choose a password with at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('The passwords do not match.'); return }

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (error) {
      setError('We could not update your password. Request a fresh password link and try again.')
      return
    }

    window.location.assign('/account?password_updated=1')
  }

  async function handlePasswordResetRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get('email') ?? '').trim()
    if (!email) { setError('Enter your email address.'); return }

    setError('')
    setMessage('')
    setSending(true)
    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?mode=update`,
    })
    setSending(false)

    if (resetError) {
      setError('We could not send the password email. Please wait a minute and try again.')
      return
    }

    setMessage('If that email has an account, a secure password link has been sent.')
  }

  const isUpdate = screen === 'preparing' || screen === 'update'

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
          <p>{isUpdate ? 'Preparing your secure password reset.' : 'Enter your email address and we will send you a secure link to set a new password.'}</p>

          {error && <p role="alert" style={{ color: 'var(--burgundy)' }}>{error}</p>}
          {message && <p role="status">{message}</p>}
          {screen === 'preparing' && <p role="status">Verifying your password-reset link…</p>}

          {screen === 'update' && (
            <form onSubmit={handlePasswordUpdate}>
              <label htmlFor="password">New password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
              <label htmlFor="confirm_password">Confirm new password</label>
              <input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" minLength={8} required />
              <button className="btn btn-primary auth-action-btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save new password'}</button>
            </form>
          )}

          {(screen === 'request' || screen === 'invalid') && (
            <form onSubmit={handlePasswordResetRequest}>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
              <button className="btn btn-primary auth-action-btn" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send password link'}</button>
            </form>
          )}

          <p style={{ marginTop: 20 }}><Link className="auth-switch-btn" href="/login">Return to sign in</Link></p>
        </div>
      </section>
    </main>
  )
}
