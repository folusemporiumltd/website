import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function subscribe(formData:FormData){
  'use server'
  const supabase=await createClient()
  const email=String(formData.get('email')||'').trim()
  const fullName=String(formData.get('full_name')||'').trim()
  const {error}=await supabase.rpc('subscribe_newsletter',{p_email:email,p_full_name:fullName,p_source:'newsletter_page'})
  if(error) redirect('/newsletter?error='+encodeURIComponent(error.message))
  redirect('/newsletter?message='+encodeURIComponent('Thank you. You are now subscribed to Folus Emporium updates.'))
}

async function unsubscribe(formData:FormData){
  'use server'
  const token=String(formData.get('token')||'').trim()
  if(!token) redirect('/newsletter?error='+encodeURIComponent('Invalid unsubscribe link.'))
  const supabase=await createClient()
  const {error}=await supabase.rpc('unsubscribe_newsletter',{p_token:token})
  if(error) redirect('/newsletter?error='+encodeURIComponent('We could not process your unsubscribe request.'))
  redirect('/newsletter?message='+encodeURIComponent('You have been unsubscribed from Folus Emporium marketing emails.'))
}

export default async function NewsletterPage({searchParams}:{searchParams:Promise<{unsubscribe?:string,message?:string,error?:string}>}){
  const params=await searchParams
  const token=params.unsubscribe
  return <main><header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/login">My Account</Link></nav></div></header><section className="section"><div className="container" style={{maxWidth:680}}><div className="eyebrow">Stay connected</div><h1>Folus Emporium Newsletter</h1><p className="muted">Receive new product announcements, useful food and lifestyle updates, and selected Folus Emporium offers.</p>
  {params.message?<p role="status" style={{background:'#edf8f0',padding:14,borderRadius:10,fontWeight:700}}>{params.message}</p>:null}
  {params.error?<p role="alert" style={{background:'#fff0f1',color:'var(--burgundy)',padding:14,borderRadius:10,fontWeight:700}}>{params.error}</p>:null}
  {token?<div className="cart-summary" style={{position:'static',marginTop:24}}><h2>Unsubscribe</h2><p>Stop receiving Folus Emporium promotional newsletters at this email address?</p><form action={unsubscribe}><input type="hidden" name="token" value={token}/><button className="btn btn-primary" type="submit">Confirm unsubscribe</button></form></div>:<div className="cart-summary" style={{position:'static',marginTop:24}}><h2>Join our mailing list</h2><form action={subscribe} style={{display:'grid',gap:14}}><label>Full name <span className="muted">(optional)</span><input name="full_name" autoComplete="name"/></label><label>Email address<input name="email" type="email" autoComplete="email" required/></label><p className="muted" style={{margin:0,fontSize:13}}>By subscribing, you agree to receive Folus Emporium marketing emails. You can unsubscribe at any time.</p><div><button className="btn btn-primary" type="submit">Subscribe</button></div></form></div>}
 </div></section></main>
}
