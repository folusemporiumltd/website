'use client'

import { useState } from 'react'

type Action = (formData: FormData) => void | Promise<void>

export default function NewsletterComposer({
  activeCount,
  canSendCustomers,
  adminEmail,
  sendNewsletter,
  sendTestNewsletter,
}: {
  activeCount: number
  canSendCustomers: boolean
  adminEmail: string
  sendNewsletter: Action
  sendTestNewsletter: Action
}) {
  const [subject, setSubject] = useState('')
  const [preview, setPreview] = useState('')
  const [body, setBody] = useState('')

  return (
    <section className="cart-summary" style={{ position: 'static', marginBottom: 28 }}>
      <div className="eyebrow">Create campaign</div>
      <h2>Compose newsletter</h2>
      <form style={{ display: 'grid', gap: 14, maxWidth: 760 }}>
        <label>
          Subject
          <input
            name="subject"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Fresh from Folus Emporium this week"
          />
        </label>
        <label>
          Preview text
          <input
            name="preview"
            value={preview}
            onChange={(e) => setPreview(e.target.value)}
            placeholder="Short inbox preview (optional)"
          />
        </label>
        <label>
          Message
          <textarea
            name="body"
            rows={10}
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your newsletter message here..."
          />
        </label>

        <div style={{ border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', background: '#faf7f2' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line)', fontWeight: 800, color: 'var(--burgundy)' }}>
            Email preview
          </div>
          <div style={{ padding: 18, background: '#fff' }}>
            <div style={{ fontSize: 12, color: '#766b68', marginBottom: 6 }}>{preview || 'Inbox preview text will appear here.'}</div>
            <h3 style={{ margin: '0 0 16px' }}>{subject || 'Your newsletter subject'}</h3>
            <div style={{ color: '#6f1734', fontWeight: 800, fontSize: 18, marginBottom: 18 }}>FOLUS EMPORIUM</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#332b2b' }}>{body || 'Your newsletter message will appear here as you type.'}</div>
            <hr style={{ border: 0, borderTop: '1px solid #eadfd5', margin: '24px 0' }} />
            <div style={{ fontSize: 12, color: '#766b68' }}>Every customer email will include an unsubscribe link.</div>
          </div>
        </div>

        <p className="muted" style={{ margin: 0 }}>
          Only customers who explicitly opted in and remain subscribed can receive newsletters.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <button className="btn" type="submit" formAction={sendTestNewsletter} formNoValidate>
            Send Test to Me
          </button>
          <span className="muted" style={{ fontSize: 13 }}>Test recipient: {adminEmail}</span>
        </div>

        {canSendCustomers ? (
          <>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 600 }}>
              <input name="confirm_send" type="checkbox" required style={{ width: 18, height: 18, marginTop: 2 }} />
              <span>I have reviewed the preview and confirm that this newsletter should be sent to {activeCount} subscribed customer{activeCount === 1 ? '' : 's'}.</span>
            </label>
            <div>
              <button className="btn btn-primary" type="submit" formAction={sendNewsletter}>
                Confirm &amp; Send to {activeCount} subscriber{activeCount === 1 ? '' : 's'}
              </button>
            </div>
          </>
        ) : (
          <div role="status" style={{ background: '#fff6df', border: '1px solid #efd9a0', borderRadius: 10, padding: 14 }}>
            <strong>Customer sending is locked.</strong> You can compose, preview and send tests now. Verify a Folus Emporium domain in Resend before sending to customers.
          </div>
        )}
      </form>
    </section>
  )
}
