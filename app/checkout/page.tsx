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
    const email = String(form.get('email') || '')
    const customerName = String(form.get('name') || '')
    const customerPhone = String(form.get('phone') || '')
    const address = String(form.get('address') || '')
    const city = String(form.get('city') || '')
    const state = String(form.get('state') || '')
    const reference = `FE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount: subtotal,
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

  return <main><header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/brand/folus-emporium-logo.jpg" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Curating Excellence</small></span></Link><nav className="navlinks"><Link href="/shop">Shop</Link><Link href="/cart">Cart</Link></nav></div></header><section className="section"><div className="container cart-layout"><form className="cart-summary" onSubmit={handleSubmit} style={{position:'static'}}><div className="eyebrow">Secure checkout</div><h1>Delivery details</h1><label>Full name<input required name="name" placeholder="Your full name"/></label><label>Email address<input required type="email" name="email" placeholder="you@example.com"/></label><label>Phone number<input required name="phone" placeholder="0800 000 0000"/></label><label>Delivery address<textarea required name="address" placeholder="House number, street, area" rows={4}/></label><label>City<input required name="city" placeholder="Ibadan"/></label><label>State<input required name="state" placeholder="Oyo"/></label>{error && <p role="alert" className="muted" style={{color:'var(--burgundy)'}}>{error}</p>}<button className="btn btn-primary checkout-btn" type="submit" disabled={loading}>{loading ? 'Connecting to Paystack…' : 'Pay securely with Paystack'}</button><p className="muted">You will be redirected to Paystack's secure checkout to complete payment.</p></form><aside className="cart-summary" style={{position:'static'}}><div className="eyebrow">Your order</div><h2>Order summary</h2>{items.map(item => <div className="summary-row" key={item.id}><span>{item.name} × {item.quantity}</span><strong>₦{(item.price*item.quantity).toLocaleString('en-NG')}</strong></div>)}<div className="summary-row" style={{marginTop:18}}><span>Total</span><strong>₦{subtotal.toLocaleString('en-NG')}</strong></div></aside></div></section></main>
}
