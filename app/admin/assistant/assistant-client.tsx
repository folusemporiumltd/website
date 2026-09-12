'use client'

import { useMemo, useState } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }
type Props = {
  initialMessages: Message[]
  openTasks: number
  pendingApprovals: number
  recentActivity: Array<{ id: string; summary: string; created_at: string }>
}

const quickActions = [
  'Prepare today’s business administration brief.',
  'Show me orders and payments that need follow-up.',
  'Which products or package sizes are low in stock?',
  'Summarise recent customer activity and returning-customer opportunities.',
  'Prepare a sales follow-up plan for today.',
  'Draft a professional customer follow-up message for an outstanding order.'
]

export default function AssistantClient({ initialMessages, openTasks, pendingApprovals, recentActivity }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [threadId, setThreadId] = useState('')
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const canSend = useMemo(() => input.trim().length > 0 && !busy, [input, busy])

  async function send(text?: string) {
    const message = (text ?? input).trim()
    if (!message || busy) return
    setBusy(true)
    setError('')
    setMessages(prev => [...prev, { role: 'user', content: message }])
    setInput('')
    try {
      const res = await fetch('/api/admin/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, threadId: threadId || undefined })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'The assistant could not complete this request.')
      if (data.threadId) setThreadId(data.threadId)
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The assistant could not complete this request.')
    } finally {
      setBusy(false)
    }
  }

  function newConversation(){
    if(busy)return
    setThreadId('')
    setMessages([])
    setInput('')
    setError('')
  }

  return <div className="ai-va-layout">
    <section className="ai-va-chat-card">
      <div className="ai-va-chat-head">
        <div><div className="eyebrow">Virtual Assistant · Business Administration</div><h2>Ask Folus VA</h2><p className="muted">Business operations, customers, sales, payments, inventory and administration.</p></div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><span className="ai-va-status">Admin only</span><button type="button" className="btn btn-outline" onClick={newConversation} disabled={busy}>New chat</button></div>
      </div>

      <div className="ai-va-quick-actions">
        {quickActions.map(action => <button key={action} type="button" onClick={() => send(action)} disabled={busy}>{action}</button>)}
      </div>

      <div className="ai-va-messages" aria-live="polite">
        {messages.length === 0 ? <div className="ai-va-empty"><strong>Folus VA is ready.</strong><p>Ask for a management brief, order follow-up, sales analysis, customer summary, inventory check or administrative support.</p></div> : null}
        {messages.map((m, i) => <div key={i} className={`ai-va-message ${m.role}`}><span>{m.role === 'user' ? 'You' : 'Folus VA'}</span><p>{m.content}</p></div>)}
        {busy ? <div className="ai-va-message assistant"><span>Folus VA</span><p>Reviewing current business data…</p></div> : null}
      </div>

      {error ? <div className="ai-va-error">{error}</div> : null}
      <div className="ai-va-composer">
        <textarea value={input} onChange={e => setInput(e.target.value)} rows={3} placeholder="Ask Folus VA to review the business, prepare a report, draft a follow-up, or identify what needs attention…" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (canSend) send() } }} />
        <button className="btn btn-primary" type="button" disabled={!canSend} onClick={() => send()}>{busy ? 'Working…' : 'Send to Folus VA'}</button>
      </div>
    </section>

    <aside className="ai-va-side">
      <article className="admin-dashboard-panel"><div className="eyebrow">Control centre</div><h3>Tasks & approvals</h3><div className="ai-va-kpis"><div><strong>{openTasks}</strong><span>Open tasks</span></div><div><strong>{pendingApprovals}</strong><span>Pending approvals</span></div></div><p className="muted">Sensitive financial, customer-facing and destructive actions should remain approval-controlled.</p></article>
      <article className="admin-dashboard-panel"><div className="eyebrow">Agent tools</div><h3>Available now</h3><ul className="ai-va-tool-list"><li>Orders & payment records</li><li>Customer CRM data</li><li>Products & catalogue</li><li>Inventory & stock movements</li><li>Sales reports & analytics</li><li>Invoices / receipts context</li><li>Admin task & approval records</li></ul></article>
      <article className="admin-dashboard-panel"><div className="eyebrow">Recent activity</div><h3>Agent audit log</h3>{recentActivity.length ? <div className="ai-va-activity">{recentActivity.map(a => <div key={a.id}><strong>{a.summary}</strong><small>{new Date(a.created_at).toLocaleString('en-NG')}</small></div>)}</div> : <p className="muted">No agent activity recorded yet.</p>}</article>
    </aside>
  </div>
}
