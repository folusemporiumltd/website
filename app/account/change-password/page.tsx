import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChangePasswordForm from '../change-password-form'

export default async function ChangePasswordPage(){
 const supabase=await createClient()
 const {data}=await supabase.auth.getUser()
 if(!data.user)redirect('/login?next=/account/change-password&mode=signin')

 return <main>
  <header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/cart">Cart</Link><Link href="/account">My Account</Link></nav></div></header>
  <section className="section"><div className="container" style={{maxWidth:900}}>
   <Link href="/account" className="muted" style={{display:'inline-block',marginBottom:18,textDecoration:'none'}}>← Back to My Account</Link>
   <div className="eyebrow">Account security</div>
   <h1>Change Password</h1>
   <p className="muted" style={{maxWidth:650}}>Update the password you use to sign in to your Folus Emporium account.</p>
   <ChangePasswordForm/>
  </div></section>
 </main>
}
