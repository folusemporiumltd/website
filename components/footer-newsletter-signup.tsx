'use client'

import { FormEvent, useState } from 'react'

export default function FooterNewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  async function subscribe() {
    if (busy) return
    const value = email.trim().toLowerCase()
    if (!value) {
      setStatus('Please enter your email address.')
      return
    }

    setBusy(true)
    setStatus('Subscribing…')

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: value, source: 'footer' }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result?.ok) {
        setStatus(result?.error || 'Subscription could not be completed. Please try again.')
        return
      }
      setEmail('')
      setStatus('You’re subscribed. Thank you!')
    } catch {
      setStatus('Subscription could not be completed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void subscribe()
  }

  return (
    <div className="footer-newsletter-host" style={{ flex: '1 1 320px', maxWidth: 430, margin: '0 auto', textAlign: 'center', padding: '0 18px' }}>
      <b style={{ display: 'block', marginBottom: 8 }}>Join Our Newsletter</b>
      <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.5 }}>Get Folus Emporium product updates, offers and useful food tips.</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <input type="email" aria-label="Email address for newsletter" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ minWidth: 210, flex: '1 1 220px', maxWidth: 290, padding: '10px 12px', borderRadius: 8, border: '1px solid #d9c9c1' }}/>
        <button className="btn btn-primary" type="button" onClick={() => void subscribe()} disabled={busy} style={{ padding: '10px 16px' }}>{busy ? 'Subscribing…' : 'Subscribe'}</button>
      </form>
      {status ? <div role="status" aria-live="polite" style={{ fontSize: 12, marginTop: 8 }}>{status}</div> : null}
    </div>
  )
}
