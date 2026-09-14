'use client'

import { useMemo, useState } from 'react'

type GmailAccount={id:string;email:string|null;connected:boolean;canSend?:boolean;status:string;scope:string|null;expiresAt:string|null}
type Approval={id:string;title:string;payload:any;status:string;created_at:string}

type Props={accounts:GmailAccount[];initialApprovals:Approval[];threadId:string}

export default function GmailApprovalPanel({accounts,initialApprovals,threadId}:Props){
  const sendable=useMemo(()=>accounts.filter(a=>a.connected&&a.canSend),[accounts])
  const [accountEmail,setAccountEmail]=useState(sendable[0]?.email||'')
  const [instruction,setInstruction]=useState('')
  const [approvals,setApprovals]=useState<Approval[]>(initialApprovals)
  const [busy,setBusy]=useState(false)
  const [actionBusy,setActionBusy]=useState('')
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')

  async function generate(){
    if(!accountEmail||!instruction.trim()||busy)return
    setBusy(true);setError('');setNotice('')
    try{
      const res=await fetch('/api/admin/assistant/email-drafts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accountEmail,instruction:instruction.trim(),threadId:threadId||undefined})})
      const data=await res.json()
      if(!res.ok)throw new Error(data.error||'Could not prepare the email draft.')
      setApprovals(p=>[data.approval,...p])
      setInstruction('')
      setNotice('Draft prepared. Review it carefully before approving send.')
    }catch(e){setError(e instanceof Error?e.message:'Could not prepare the email draft.')}finally{setBusy(false)}
  }

  async function decide(id:string,decision:'approve'|'reject'){
    if(actionBusy)return
    setActionBusy(id);setError('');setNotice('')
    try{
      const res=await fetch(`/api/admin/assistant/email-approvals/${encodeURIComponent(id)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision})})
      const data=await res.json()
      if(!res.ok)throw new Error(data.error||'Could not process the approval.')
      setApprovals(p=>p.filter(a=>a.id!==id))
      setNotice(decision==='approve'?'Approved email sent successfully.':'Email draft rejected. Nothing was sent.')
    }catch(e){setError(e instanceof Error?e.message:'Could not process the approval.')}finally{setActionBusy('')}
  }

  return <div className="admin-dashboard-panel" style={{marginBottom:18}}>
    <div className="eyebrow">Approval-gated email</div>
    <h3>Draft with Folus VA → Review → Approve → Send</h3>
    <p className="muted">Folus VA can prepare customer and business emails, but nothing is sent until an administrator approves the exact draft.</p>

    {accounts.some(a=>a.connected&&!a.canSend)?<div style={{display:'grid',gap:8,margin:'12px 0 16px'}}>{accounts.filter(a=>a.connected&&!a.canSend).map(a=><div key={a.id} style={{padding:'10px 12px',border:'1px solid var(--line)',borderRadius:10}}><strong>{a.email}</strong><div className="muted" style={{fontSize:13,margin:'4px 0 8px'}}>Reconnect once to enable approval-gated Gmail sending.</div><a className="btn btn-outline" href={`/api/admin/integrations/google/gmail/connect?account=${encodeURIComponent(a.email||'')}`}>Enable approved sending</a></div>)}</div>:null}

    {sendable.length?<div style={{display:'grid',gap:10,marginTop:14}}>
      <label><strong>Send from</strong><select value={accountEmail} onChange={e=>setAccountEmail(e.target.value)} style={{width:'100%',marginTop:6,padding:'10px 12px',border:'1px solid var(--line)',borderRadius:10,background:'white'}}>{sendable.map(a=><option key={a.id} value={a.email||''}>{a.email}</option>)}</select></label>
      <label><strong>What should Folus VA prepare?</strong><textarea value={instruction} onChange={e=>setInstruction(e.target.value)} rows={4} placeholder="Example: Reply to the latest customer asking about delivery and explain that we will confirm the delivery schedule shortly. Recipient: customer@example.com" style={{width:'100%',marginTop:6,padding:'10px 12px',border:'1px solid var(--line)',borderRadius:10,resize:'vertical'}}/></label>
      <div><button className="btn btn-primary" type="button" onClick={generate} disabled={busy||!instruction.trim()}>{busy?'Preparing draft…':'Prepare email draft'}</button></div>
    </div>:<p><strong>Approved sending is not enabled on a Gmail account yet.</strong></p>}

    {error?<div className="ai-va-error" style={{marginTop:12}}>{error}</div>:null}
    {notice?<div style={{marginTop:12,padding:'10px 12px',border:'1px solid var(--line)',borderRadius:10}}>{notice}</div>:null}

    <div style={{marginTop:20}}><h4>Pending email approvals</h4>{approvals.length===0?<p className="muted">No Gmail drafts are waiting for approval.</p>:<div style={{display:'grid',gap:12}}>{approvals.map(a=>{const p=a.payload||{};return <article key={a.id} style={{border:'1px solid var(--line)',borderRadius:12,padding:14,background:'#fff'}}><div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><strong>{a.title}</strong><small className="muted">{new Date(a.created_at).toLocaleString('en-NG')}</small></div><div style={{marginTop:10,fontSize:14}}><div><strong>From:</strong> {p.account_email||'—'}</div><div><strong>To:</strong> {p.to||'—'}</div><div><strong>Subject:</strong> {p.subject||'—'}</div></div><div style={{marginTop:10,padding:'12px 14px',background:'#fcfaf8',borderRadius:10,whiteSpace:'pre-wrap',lineHeight:1.55}}>{p.body||''}</div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}><button className="btn btn-primary" type="button" disabled={Boolean(actionBusy)} onClick={()=>decide(a.id,'approve')}>{actionBusy===a.id?'Sending…':'Approve & send'}</button><button className="btn btn-outline" type="button" disabled={Boolean(actionBusy)} onClick={()=>decide(a.id,'reject')}>Reject</button></div></article>})}</div>}</div>
  </div>
}
