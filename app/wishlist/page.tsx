'use client'

import Link from 'next/link'
import { useWishlist } from '@/components/wishlist-provider'

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlist()

  return <main>
    <div className="topbar"><div className="container"><span>Saved for later</span><span>Folus Emporium Wishlist</span></div></div>
    <header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium circular logo"/><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/cart">Cart</Link><Link href="/account">My Account</Link></nav></div></header>
    <section className="section"><div className="container"><div className="section-head"><div><div className="eyebrow">Your favourites</div><h1>My Wishlist</h1></div>{items.length > 0 && <button type="button" className="btn btn-outline" onClick={clearWishlist}>Clear wishlist</button>}</div>
      {items.length ? <div className="products">{items.map(item => <article className="product-card" key={item.id}><Link href={`/shop/${item.slug}`}><div className="product-image">{item.image_url ? <img src={item.image_url} alt={item.name}/> : <span>{item.name}</span>}</div></Link><div className="product-body"><span className="status">{item.sizeLabel ?? 'Saved product'}</span><h3><Link href={`/shop/${item.slug}`}>{item.name}</Link></h3><strong>{item.price > 0 ? `₦${Number(item.price).toLocaleString('en-NG')}` : 'Price to be updated'}</strong><div className="product-actions"><Link className="btn btn-primary" href={`/shop/${item.slug}`}>View product</Link><button type="button" className="btn btn-outline" onClick={() => removeItem(item.id)}>Remove</button></div></div></article>)}</div> : <div className="empty"><h3>Your wishlist is empty.</h3><p>Tap the heart icon on any product card to save it here.</p><Link className="btn btn-primary" href="/shop">Browse products</Link></div>}
    </div></section>
  </main>
}
