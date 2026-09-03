'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/components/cart-provider'

export default function CheckoutPage() {
  const { items, subtotal } = useCart()
  const [submitted, setSubmitted] = useState(false)

  if (submitted) return <main><section className="section"><div className="container empty"><div className="eyebrow">Thank you</div><h1>Order details received</h1><p>Your checkout form has been captured. Payment integration will be enabled in the next phase.</p><Link className="btn btn-primary" href="/shop">Continue shopping</Link></div></section></main>

  if (!items.length) return <main><section className="section"><div className="container empty"><h1>Your cart is empty</h1><p>Add products before proceeding to checkout.</p><Link className="btn btn-primary" href="/shop">Shop now</Link></div></section></main>

  return <main><header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/brand/folus-emporium-logo.jpg" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Curating Excellence</small></span></Link><nav className="navlinks"><Link href="/shop">Shop</Link><Link href="/cart">Cart</Link></nav></div></header><section className="section"><div className="container cart-layout"><form className="cart-summary" onSubmit={e => {e.preventDefault();setSubmitted(true)}} style={{position:'static'}}><div className="eyebrow">Secure checkout</div><h1>Delivery details</h1><label>Full name<input required name="name" placeholder="Your full name"/></label><label>Email address<input required type="email" name="email" placeholder="you@example.com"/></label><label>Phone number<input required name="phone" placeholder="0800 000 0000"/></label><label>Delivery address<textarea required name="address" placeholder="House number, street, area" rows={4}/></label><label>City<input required name="city" placeholder="Ibadan"/></label><label>State<input required name="state" placeholder="Oyo"/></label><button className="btn btn-primary checkout-btn" type="submit">Continue to payment</button></form><aside className="cart-summary" style={{position:'static'}}><div className="eyebrow">Your order</div><h2>Order summary</h2>{items.map(item => <div className="summary-row" key={item.id}><span>{item.name} × {item.quantity}</span><strong>₦{(item.price*item.quantity).toLocaleString('en-NG')}</strong></div>)}<div className="summary-row" style={{marginTop:18}}><span>Total</span><strong>₦{subtotal.toLocaleString('en-NG')}</strong></div><p className="muted">Payment by Paystack will be connected after the checkout flow is verified.</p></aside></div></section></main>
}
