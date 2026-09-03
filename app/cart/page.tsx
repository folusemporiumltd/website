'use client'

import Link from 'next/link'
import { useCart } from '@/components/cart-provider'

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart()

  return <main><header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/brand/folus-emporium-logo.jpg" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Curating Excellence</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/account">My Account</Link></nav></div></header>
    <section className="section"><div className="container cart-page"><div className="section-head"><div><div className="eyebrow">Your selection</div><h1>Shopping Cart</h1></div><Link className="btn btn-outline" href="/shop">Continue shopping</Link></div>
      {items.length === 0 ? <div className="empty"><h2>Your cart is empty</h2><p>Explore our carefully curated products and add your favourites.</p><Link className="btn btn-primary" href="/shop">Shop Folus Emporium</Link></div> : <div className="cart-layout"><div className="cart-items">{items.map(item => <article className="cart-item" key={item.id}><div className="cart-thumb">{item.image_url ? <img src={item.image_url} alt={item.name}/> : <span>{item.name}</span>}</div><div className="cart-info"><Link href={`/shop/${item.slug}`}><h3>{item.name}</h3></Link><strong>₦{item.price.toLocaleString('en-NG')}</strong><div className="quantity"><button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity">−</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity">+</button><button className="remove" onClick={() => removeItem(item.id)}>Remove</button></div></div></article>)}</div><aside className="cart-summary"><div className="eyebrow">Order summary</div><h2>Summary</h2><div className="summary-row"><span>Subtotal</span><strong>₦{subtotal.toLocaleString('en-NG')}</strong></div><p className="muted">Delivery fee and payment options will be calculated at checkout.</p><Link className="btn btn-primary checkout-btn" href="/checkout">Proceed to checkout</Link></aside></div>}
    </div></section></main>
}
