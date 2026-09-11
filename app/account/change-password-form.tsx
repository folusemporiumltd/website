'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!currentPassword) {
      setError('Enter your current password.')
      return
    }

    if (newPassword.length < 8) {
      setError('Your new password must be at least 8 characters long.')
      return
    }

    if (newPassword === currentPassword) {
      setError('Your new password must be different from your current password.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('The new password and confirmation do not match.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: userData, error: userError } = await supabase.auth.getUser()
      const email = userData.user?.email

      if (userError || !email) {
        setError('Your session could not be verified. Please sign in again and retry.')
        return
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })

      if (verifyError) {
        const text = verifyError.message.toLowerCase()
        if (text.includes('invalid login credentials') || text.includes('invalid credentials')) {
          setError('Your current password is incorrect. Please try again.')
        } else {
          setError(verifyError.message || 'We could not verify your current password. Please try again.')
        }
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        const text = updateError.message.toLowerCase()
        if (text.includes('same password') || text.includes('different')) {
          setError('Please choose a password that is different from your current password.')
        } else {
          setError(updateError.message || 'We could not change your password. Please try again.')
        }
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Password changed successfully. Use your new password the next time you sign in.')
    } catch {
      setError('We could not change your password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ marginTop: 38 }}>
      <div className="eyebrow">Security</div>
      <h2 style={{ color: 'var(--burgundy)' }}>Change password</h2>
      <p className="muted" style={{ maxWidth: 650 }}>
        Enter your current password, then choose a new password with at least 8 characters.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: 18,
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: 18,
          padding: 20,
          display: 'grid',
          gap: 16,
          maxWidth: 650,
        }}
      >
        <label style={{ display: 'grid', gap: 7, fontWeight: 700 }}>
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
            disabled={loading}
            style={{ width: '100%' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 7, fontWeight: 700 }}>
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            disabled={loading}
            style={{ width: '100%' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 7, fontWeight: 700 }}>
          Confirm new password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            disabled={loading}
            style={{ width: '100%' }}
          />
        </label>

        {error ? (
          <div role="alert" style={{ color: '#8b1e2d', fontWeight: 700 }}>
            {error}
          </div>
        ) : null}

        {message ? (
          <div role="status" style={{ color: '#1f6b45', fontWeight: 700 }}>
            {message}
          </div>
        ) : null}

        <div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Changing password…' : 'Change password'}
          </button>
        </div>
      </form>
    </section>
  )
}
