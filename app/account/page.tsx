import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) redirect('/login?next=/account&mode=signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name,phone,role')
    .eq('id', user.id)
    .maybeSingle()

  const metadata = user.user_metadata ?? {}
  const fullName = profile?.full_name || metadata.full_name || 'Customer'
  const phone = profile?.phone || metadata.phone || 'Not provided'
  const address = metadata.delivery_address || 'Not provided'
  const city = metadata.delivery_city || ''
  const state = metadata.delivery_state || ''
  const location = [city, state].filter(Boolean).join(', ') || 'Not provided'

  return (
    <main>
      <header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/cart">Cart</Link></nav></div></header>
      <section className="section"><div className="container" style={{ maxWidth: 760 }}>
        <div className="eyebrow">Customer account</div>
        <h1>My Account</h1>
        <p>Welcome back, {fullName}.</p>

        <div className="cart-summary" style={{ position: 'static', marginTop: 24 }}>
          <h2>Your details</h2>
          <div className="account-details">
            <div><span>Full name</span><strong>{fullName}</strong></div>
            <div><span>Email</span><strong>{user.email}</strong></div>
            <div><span>Phone</span><strong>{phone}</strong></div>
            <div><span>Delivery address</span><strong>{address}</strong></div>
            <div><span>City / State</span><strong>{location}</strong></div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
            <Link className="btn btn-primary" href="/checkout">Proceed to checkout</Link>
            <Link className="btn btn-outline" href="/shop">Continue shopping</Link>
            <Link className="btn btn-outline" href="/cart">View cart</Link>
            <SignOutButton />
          </div>
        </div>
      </div></section>
    </main>
  )
}
