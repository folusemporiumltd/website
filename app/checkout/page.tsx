'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/components/cart-provider'

export default function CheckoutPage() {
  const { items, subtotal } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') || '').trim()
    const customerName = String(form.get('name') || '').trim()
    const customerPhone = String(form.get('phone') || '').trim()
    const address = String(form.get('address') || '').trim()
    const city = String(form.get('city') || '').trim()
    const state = String(form.get('state') || '').trim()
    const reference = `FE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          reference,
          callback_url: `${window.location.origin}/payment/callback`,
          metadata: {
            customer_name: customerName,
            customer_phone: customerPhone,
            delivery_address: { address, city, state },
            items: items.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, unit_price: item.price })),
          },
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to start payment.')
      window.location.href = data.authorization_url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start payment.')
      setLoading(false)
    }
  }

  if (!items.length) return <main><section className="section"><div className="container empty"><h1>Your cart is empty</h1><p>Add products before proceeding to checkout.</p><Link className="btn btn-primary" href="/shop">Shop now</Link></div></section></main>

  return <main><header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium circular logo"/><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness</small></span></Link><nav className="navlinks"><Link href="/shop">Shop</Link><Link href="/cart">Cart</Link></nav></div></header><section className="section"><div className="container cart-layout"><form className="cart-summary" onSubmit={handleSubmit} style={{position:'static'}}><div className="eyebrow">Secure checkout</div><h1>Delivery details</h1><label>Full name<input required name="name" autoComplete="name" placeholder="Your full name"/></label><label>Email address<input required type="email" name="email" autoComplete="email" placeholder="you@example.com"/></label><label>Phone number<input required type="tel" name="phone" autoComplete="tel" placeholder="0800 000 0000"/></label><label>Delivery address<textarea required name="address" autoComplete="street-address" placeholder="House number, street, area" rows={4}/></label><label>City<input required name="city" autoComplete="address-level2" placeholder="Ibadan"/></label><label>State<input required name="state" autoComplete="address-level1" placeholder="Oyo"/></label>{error && <p role="alert" className="muted" style={{color:'var(--burgundy)'}}>{error}</p>}<button className="btn btn-primary checkout-btn" type="submit" disabled={loading}>{loading ? 'Connecting to Paystack…' : 'Pay securely with Paystack'}</button><p className="muted">Your payment is processed securely by Paystack. The final payable amount is calculated from the current catalogue prices on our server.</p></form><aside className="cart-summary" style={{position:'static'}}><div className="eyebrow">Your order</div><h2>Order summary</h2>{items.map(item => <div className="summary-row" key={item.id}><span>{item.name} × {item.quantity}</span><strong>₦{(item.price*item.quantity).toLocaleString('en-NG')}</strong></div>)}<div className="summary-row" style={{marginTop:18}}><span>Subtotal</span><strong>₦{subtotal.toLocaleString('en-NG')}</strong></div><div className="summary-row"><span>Delivery</span><strong>₦0</strong></div><div className="summary-row" style={{marginTop:8}}><span>Total</span><strong>₦{subtotal.toLocaleString('en-NG')}</strong></div><p className="muted">Delivery fee is currently ₦0. A delivery-fee schedule can be added when your delivery zones are defined.</p></aside></div></section></main>
}
