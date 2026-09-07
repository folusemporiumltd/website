import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims?.sub) redirect('/login')

  return (
    <main>
      <header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/cart">Cart</Link></nav></div></header>
      <section className="section"><div className="container" style={{ maxWidth: 760 }}>
        <div className="eyebrow">Customer account</div>
        <h1>My Account</h1>
        <p>Welcome back{data.claims.email ? `, ${data.claims.email}` : ''}.</p>
        <div className="cart-summary" style={{ position: 'static', marginTop: 24 }}>
          <h2>Your Folus Emporium account</h2>
          <p className="muted">Your account is protected by Supabase Auth. You can continue shopping and return here whenever you need to manage your signed-in session.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
            <Link className="btn btn-primary" href="/shop">Continue shopping</Link>
            <Link className="btn btn-outline" href="/cart">View cart</Link>
            <SignOutButton />
          </div>
        </div>
      </div></section>
    </main>
  )
}
