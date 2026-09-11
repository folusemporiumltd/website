import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import AdminBreadcrumbs from '@/components/admin-breadcrumbs'
import NewsletterComposer from './newsletter-composer'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://website-smoky-kappa-22.vercel.app'
const TEST_FROM = 'Folus Emporium <onboarding@resend.dev>'

async function requireAdmin(next='/admin/newsletter') {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) redirect(`/login?next=${encodeURIComponent(next)}&mode=signin`)
  const { data: isAdmin } = await supabase.rpc('get_my_admin_status')
  if (isAdmin !== true) redirect('/account?admin_error=access')
  return { supabase, user: authData.user }
}

function escapeHtml(value:string){return value.replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c] || c))}
function emailBody(body:string,unsubscribeUrl:string){
  const paragraphs=body.split(/\n{2,}/).map(p=>`<p style="font-size:16px;line-height:1.7;color:#332b2b">${escapeHtml(p).replace(/\n/g,'<br>')}</p>`).join('')
  return `<!doctype html><html><body style="margin:0;background:#faf7f2;font-family:Arial,sans-serif"><div style="max-width:640px;margin:0 auto;padding:30px 18px"><div style="background:#fff;border:1px solid #eadfd5;border-radius:18px;padding:30px"><div style="color:#6f1734;font-weight:800;font-size:20px;margin-bottom:22px">FOLUS EMPORIUM</div>${paragraphs}<hr style="border:0;border-top:1px solid #eadfd5;margin:28px 0"><p style="font-size:12px;line-height:1.6;color:#766b68">You received this email because you subscribed to Folus Emporium updates. <a href="${unsubscribeUrl}" style="color:#6f1734">Unsubscribe</a>.</p></div></div></body></html>`
}

function isVerifiedDomainSender(from?:string){
  return Boolean(from && !/resend\.dev/i.test(from))
}

async function sendTestNewsletter(formData:FormData){
  'use server'
  const {user}=await requireAdmin()
  const subject=String(formData.get('subject')||'').trim()
  const body=String(formData.get('body')||'').trim()
  if(!subject||!body) redirect('/admin/newsletter?error='+encodeURIComponent('Add a subject and message before sending a test.'))
  if(!user.email) redirect('/admin/newsletter?error='+encodeURIComponent('Your admin account does not have an email address available for testing.'))

  const apiKey=process.env.RESEND_API_KEY
  if(!apiKey) redirect('/admin/newsletter?error='+encodeURIComponent('RESEND_API_KEY is not configured in Vercel.'))

  const response=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
    body:JSON.stringify({
      from:TEST_FROM,
      to:[user.email],
      subject:`[TEST] ${subject}`,
      html:emailBody(body,`${SITE_URL}/newsletter`),
    }),
    cache:'no-store',
  })

  if(!response.ok){
    const details=await response.text().catch(()=> '')
    const message=/domain|verify|testing|recipient/i.test(details)
      ? 'Resend rejected the test recipient. Until a domain is verified, the Resend test sender may only deliver to approved test recipients or the Resend account email.'
      : 'Resend rejected the test email. Check the Resend API key and sender settings.'
    redirect('/admin/newsletter?error='+encodeURIComponent(message))
  }

  redirect('/admin/newsletter?message='+encodeURIComponent(`Test newsletter sent to ${user.email}. No customer email was sent.`))
}

async function sendNewsletter(formData:FormData){
  'use server'
  const {supabase}=await requireAdmin()
  const subject=String(formData.get('subject')||'').trim()
  const preview=String(formData.get('preview')||'').trim()
  const body=String(formData.get('body')||'').trim()
  const confirmed=formData.get('confirm_send')==='on'
  if(!subject||!body) redirect('/admin/newsletter?error='+encodeURIComponent('Subject and newsletter message are required.'))
  if(!confirmed) redirect('/admin/newsletter?error='+encodeURIComponent('Review the newsletter preview and confirm the customer send before continuing.'))

  const apiKey=process.env.RESEND_API_KEY
  const from=process.env.NEWSLETTER_FROM_EMAIL
  if(!apiKey) redirect('/admin/newsletter?error='+encodeURIComponent('RESEND_API_KEY must be configured in Vercel first.'))
  if(!isVerifiedDomainSender(from)) redirect('/admin/newsletter?error='+encodeURIComponent('Customer newsletter sending is locked until a verified Folus Emporium domain is configured in NEWSLETTER_FROM_EMAIL.'))

  const {data:rows,error:listError}=await supabase.rpc('list_admin_newsletter_subscribers')
  if(listError) redirect('/admin/newsletter?error='+encodeURIComponent(listError.message))
  const subscribers=(rows??[]).filter((r:any)=>r.status==='subscribed')
  if(!subscribers.length) redirect('/admin/newsletter?error='+encodeURIComponent('There are no active newsletter subscribers yet.'))

  const {data:campaignId,error:campaignError}=await supabase.rpc('create_admin_newsletter_campaign',{p_subject:subject,p_preview_text:preview,p_body_html:body})
  if(campaignError) redirect('/admin/newsletter?error='+encodeURIComponent(campaignError.message))

  let sent=0
  for(let i=0;i<subscribers.length;i+=100){
    const batch=subscribers.slice(i,i+100).map((s:any)=>{
      const unsubscribeUrl=`${SITE_URL}/newsletter?unsubscribe=${encodeURIComponent(s.unsubscribe_token)}`
      return {from,to:[s.email],subject,html:emailBody(body,unsubscribeUrl),headers:{'List-Unsubscribe':`<${unsubscribeUrl}>`}}
    })
    const response=await fetch('https://api.resend.com/emails/batch',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':`folus-newsletter-${campaignId}-${i/100}`},body:JSON.stringify(batch),cache:'no-store'})
    if(!response.ok) redirect('/admin/newsletter?error='+encodeURIComponent('The email provider rejected the campaign. Check your Resend domain and sender settings.'))
    sent+=batch.length
  }
  await supabase.rpc('mark_admin_newsletter_campaign_sent',{p_id:campaignId,p_count:sent})
  revalidatePath('/admin/newsletter')
  redirect('/admin/newsletter?message='+encodeURIComponent(`Newsletter sent successfully to ${sent} subscriber${sent===1?'':'s'}.`))
}

export default async function NewsletterAdminPage({searchParams}:{searchParams:Promise<{message?:string,error?:string}>}){
  const params=await searchParams
  const {supabase,user}=await requireAdmin()
  const [{data:subscribers},{data:campaigns}]=await Promise.all([supabase.rpc('list_admin_newsletter_subscribers'),supabase.rpc('list_admin_newsletter_campaigns')])
  const all=subscribers??[]
  const active=all.filter((s:any)=>s.status==='subscribed')
  const canSendCustomers=Boolean(process.env.RESEND_API_KEY && isVerifiedDomainSender(process.env.NEWSLETTER_FROM_EMAIL))
  const adminEmail=user.email || 'Admin email unavailable'

  return <main><header className="nav"><div className="container nav-inner"><Link className="brand" href="/admin/dashboard"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Admin Dashboard</small></span></Link><nav className="navlinks"><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin/newsletter">Newsletter</Link><Link href="/account">Account</Link></nav></div></header><section className="section"><div className="container" style={{maxWidth:1050}}><AdminBreadcrumbs items={[{label:'Admin',href:'/admin/dashboard'},{label:'Newsletter'}]}/><div className="eyebrow">Email marketing</div><h1>Newsletter</h1><p className="muted">Manage opted-in customers and send Folus Emporium product news, offers and updates.</p>
  {params.message?<p role="status" style={{background:'#edf8f0',padding:14,borderRadius:10,fontWeight:700}}>{params.message}</p>:null}{params.error?<p role="alert" style={{background:'#fff0f1',color:'var(--burgundy)',padding:14,borderRadius:10,fontWeight:700}}>{params.error}</p>:null}
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14,margin:'24px 0'}}><div className="cart-summary" style={{position:'static'}}><div className="eyebrow">Active</div><h2>{active.length}</h2><p className="muted">Subscribed customers</p></div><div className="cart-summary" style={{position:'static'}}><div className="eyebrow">Total records</div><h2>{all.length}</h2><p className="muted">Including unsubscribed</p></div><div className="cart-summary" style={{position:'static'}}><div className="eyebrow">Campaigns</div><h2>{campaigns?.length??0}</h2><p className="muted">Created newsletters</p></div></div>

  <NewsletterComposer activeCount={active.length} canSendCustomers={canSendCustomers} adminEmail={adminEmail} sendNewsletter={sendNewsletter} sendTestNewsletter={sendTestNewsletter}/>

  <section style={{marginTop:30}}><div className="eyebrow">Subscribers</div><h2>Email list</h2>{all.length?<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={{textAlign:'left',padding:10}}>Customer</th><th style={{textAlign:'left',padding:10}}>Email</th><th style={{textAlign:'left',padding:10}}>Status</th><th style={{textAlign:'left',padding:10}}>Source</th><th style={{textAlign:'left',padding:10}}>Consent date</th></tr></thead><tbody>{all.map((s:any)=><tr key={s.id} style={{borderTop:'1px solid var(--line)'}}><td style={{padding:10}}>{s.full_name||'Not provided'}</td><td style={{padding:10}}>{s.email}</td><td style={{padding:10,textTransform:'capitalize'}}>{s.status}</td><td style={{padding:10,textTransform:'capitalize'}}>{s.source}</td><td style={{padding:10}}>{new Date(s.consent_at).toLocaleDateString('en-NG')}</td></tr>)}</tbody></table></div>:<p className="muted">No subscribers yet. New customers can opt in when creating their account.</p>}</section>
  <section style={{marginTop:34}}><div className="eyebrow">Campaign history</div><h2>Previous newsletters</h2>{campaigns?.length?<div style={{display:'grid',gap:12}}>{campaigns.map((c:any)=><article key={c.id} style={{border:'1px solid var(--line)',borderRadius:14,padding:16,background:'#fff'}}><strong>{c.subject}</strong><p className="muted" style={{margin:'5px 0 0'}}>{c.status==='sent'?`Sent to ${c.sent_count} subscriber(s) · ${new Date(c.sent_at).toLocaleString('en-NG')}`:`Draft created ${new Date(c.created_at).toLocaleString('en-NG')}`}</p></article>)}</div>:<p className="muted">No campaigns have been created yet.</p>}</section>
 </div></section></main>
}
