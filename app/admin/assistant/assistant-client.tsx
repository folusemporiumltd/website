'use client'

import { Fragment, ReactNode, useMemo, useState } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }
type ZohoStatus = { connected: boolean; status: string; scope: string | null; expiresAt: string | null }
type Props = {
  initialMessages: Message[]
  initialThreadId: string
  openTasks: number
  pendingApprovals: number
  recentActivity: Array<{ id: string; summary: string; created_at: string }>
  zohoStatus: ZohoStatus
}

const quickActions = [
  'Prepare today’s business administration brief.',
  'Show me orders and payments that need follow-up.',
  'Which products or package sizes are low in stock?',
  'Summarise recent customer activity and returning-customer opportunities.',
  'Prepare a sales follow-up plan for today.',
  'Review Zoho CRM leads, deals and tasks that need attention.',
  'Draft a professional customer follow-up message for an outstanding order.'
]

function normaliseMarkdown(value:string){
  return value
    .replace(/&#x20;/gi,' ')
    .replace(/&nbsp;/gi,' ')
    .replace(/\\([#*_|`>\-])/g,'$1')
    .replace(/\r\n/g,'\n')
}

function inlineMarkdown(text:string):ReactNode[]{
  const parts:ReactNode[]=[]
  const pattern=/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\))/g
  let last=0
  let match:RegExpExecArray|null
  let key=0
  while((match=pattern.exec(text))!==null){
    if(match.index>last)parts.push(text.slice(last,match.index))
    const token=match[0]
    if(token.startsWith('**'))parts.push(<strong key={key++}>{token.slice(2,-2)}</strong>)
    else if(token.startsWith('`'))parts.push(<code key={key++}>{token.slice(1,-1)}</code>)
    else{
      const link=token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
      if(link)parts.push(<a key={key++} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>)
      else parts.push(token)
    }
    last=pattern.lastIndex
  }
  if(last<text.length)parts.push(text.slice(last))
  return parts
}

function isTableDivider(line:string){
  const cells=line.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim())
  return cells.length>1&&cells.every(c=>/^:?-{3,}:?$/.test(c))
}

function tableCells(line:string){return line.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim())}

function MarkdownReport({content}:{content:string}){
  const lines=normaliseMarkdown(content).split('\n')
  const blocks:ReactNode[]=[]
  let i=0
  let key=0
  while(i<lines.length){
    const raw=lines[i]
    const line=raw.trim()
    if(!line){i++;continue}

    const heading=line.match(/^(#{1,4})\s+(.+)$/)
    if(heading){
      const level=Math.min(4,heading[1].length)
      const text=heading[2]
      if(level===1)blocks.push(<h2 key={key++}>{inlineMarkdown(text)}</h2>)
      else if(level===2)blocks.push(<h3 key={key++}>{inlineMarkdown(text)}</h3>)
      else blocks.push(<h4 key={key++}>{inlineMarkdown(text)}</h4>)
      i++;continue
    }

    if(line.includes('|')&&i+1<lines.length&&isTableDivider(lines[i+1])){
      const headers=tableCells(line);i+=2
      const rows:string[][]=[]
      while(i<lines.length&&lines[i].trim().includes('|')&&lines[i].trim()){
        rows.push(tableCells(lines[i]));i++
      }
      blocks.push(<div className="ai-va-table-wrap" key={key++}><table className="ai-va-report-table"><thead><tr>{headers.map((h,j)=><th key={j}>{inlineMarkdown(h)}</th>)}</tr></thead><tbody>{rows.map((row,r)=><tr key={r}>{headers.map((_,c)=><td key={c}>{inlineMarkdown(row[c]??'')}</td>)}</tr>)}</tbody></table></div>)
      continue
    }

    if(/^[-*]\s+/.test(line)){
      const items:string[]=[]
      while(i<lines.length&&/^[-*]\s+/.test(lines[i].trim())){items.push(lines[i].trim().replace(/^[-*]\s+/,''));i++}
      blocks.push(<ul key={key++}>{items.map((item,j)=><li key={j}>{inlineMarkdown(item)}</li>)}</ul>)
      continue
    }

    if(/^\d+[.)]\s+/.test(line)){
      const items:string[]=[]
      while(i<lines.length&&/^\d+[.)]\s+/.test(lines[i].trim())){items.push(lines[i].trim().replace(/^\d+[.)]\s+/,''));i++}
      blocks.push(<ol key={key++}>{items.map((item,j)=><li key={j}>{inlineMarkdown(item)}</li>)}</ol>)
      continue
    }

    const paragraph:string[]=[line];i++
    while(i<lines.length&&lines[i].trim()&&!/^(#{1,4})\s+/.test(lines[i].trim())&&!/^[-*]\s+/.test(lines[i].trim())&&!/^\d+[.)]\s+/.test(lines[i].trim())&&!(lines[i].includes('|')&&i+1<lines.length&&isTableDivider(lines[i+1]))){paragraph.push(lines[i].trim());i++}
    blocks.push(<p key={key++}>{paragraph.map((p,j)=><Fragment key={j}>{j>0?<br/>:null}{inlineMarkdown(p)}</Fragment>)}</p>)
  }
  return <div className="ai-va-report">{blocks}</div>
}

export default function AssistantClient({ initialMessages, initialThreadId, openTasks, pendingApprovals, recentActivity, zohoStatus }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [threadId, setThreadId] = useState(initialThreadId)
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
        {messages.map((m, i) => <div key={i} className={`ai-va-message ${m.role}`}><span>{m.role === 'user' ? 'You' : 'Folus VA'}</span>{m.role==='assistant'?<MarkdownReport content={m.content}/>:<p>{m.content}</p>}</div>)}
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
      <article className="admin-dashboard-panel"><div className="eyebrow">CRM integration</div><h3>Zoho CRM</h3><p><strong>{zohoStatus.connected ? 'Connected' : zohoStatus.status === 'error' ? 'Needs attention' : 'Not connected'}</strong></p><p className="muted">Folus VA uses read-only access to leads, contacts, deals and tasks. CRM changes are not executed automatically.</p>{zohoStatus.connected?<button type="button" className="btn btn-outline" onClick={()=>send('Review Zoho CRM leads, deals and tasks that need attention.')} disabled={busy}>Review CRM now</button>:<a className="btn btn-primary" href="/api/admin/integrations/zoho/connect">Connect Zoho CRM</a>}</article>
      <article className="admin-dashboard-panel"><div className="eyebrow">Agent tools</div><h3>Available now</h3><ul className="ai-va-tool-list"><li>Orders & payment records</li><li>Website customer data</li><li>Products & catalogue</li><li>Inventory & stock movements</li><li>Sales reports & analytics</li><li>Invoices / receipts context</li><li>Zoho CRM leads, contacts, deals & tasks</li><li>Admin task & approval records</li></ul></article>
      <article className="admin-dashboard-panel"><div className="eyebrow">Recent activity</div><h3>Agent audit log</h3>{recentActivity.length ? <div className="ai-va-activity">{recentActivity.map(a => <div key={a.id}><strong>{a.summary}</strong><small>{new Date(a.created_at).toLocaleString('en-NG')}</small></div>)}</div> : <p className="muted">No agent activity recorded yet.</p>}</article>
    </aside>
  </div>
}
