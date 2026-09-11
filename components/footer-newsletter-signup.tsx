'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'

export default function FooterNewsletterSignup() {
  const [target, setTarget] = useState<Element | null>(null)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const mount = () => setTarget(document.querySelector('.footer-social-row'))
    mount()
    const observer = new MutationObserver(mount)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  async function subscribe(event: FormEvent) {
    event.preventDefault()
    const value = email.trim().toLowerCase()
    if (!value) return
    setBusy(true)
    setStatus('')
    const supabase = createClient()
    const { error } = await supabase.rpc('subscribe_newsletter', {
      p_email: value,
      p_full_name: null,
      p_source: 'footer',
    })
    setBusy(false)
    if (error) {
      setStatus(error.message.includes('email') ? 'Please enter a valid email address.' : 'Subscription could not be completed. Please try again.')
      return
    }
    setEmail('')
    setStatus('You’re subscribed. Thank you!')
  }

  if (!target) return null

  return createPortal(
    <div style={{ flex: '1 1 320px', maxWidth: 430, textAlign: 'center', margin: '0 auto', padding: '0 18px' }}>
      <b style={{ display: 'block', marginBottom: 8 }}>Join Our Newsletter</b>
      <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.5 }}>Get Folus Emporium product updates, offers and useful food tips.</p>
      <form onSubmit={subscribe} style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <input
          type="email"
          aria-label="Email address for newsletter"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ minWidth: 210, flex: '1 1 220px', maxWidth: 290, padding: '10px 12px', borderRadius: 8, border: '1px solid #d9c9c1' }}
        />
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ padding: '10px 16px' }}>
          {busy ? 'Subscribing…' : 'Subscribe'}
        </button>
      </form>
      {status ? <div role="status" style={{ fontSize: 12, marginTop: 8 }}>{status}</div> : null}
    </div>,
    target
  )
}
