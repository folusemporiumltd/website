'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'folus-wishlist'

export default function WishlistClient({ product }: { product: string }) {
  const [savedProducts, setSavedProducts] = useState<string[]>([])

  useEffect(() => {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as string[]
    const next = product && !saved.includes(product) ? [...saved, product] : saved
    if (next !== saved) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSavedProducts(next)
  }, [product])

  function remove(slug: string) {
    const next = savedProducts.filter(item => item !== slug)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSavedProducts(next)
  }

  return <main>
    <div className="topbar"><div className="container"><span>Folus Emporium</span><span>Nature’s Goodness, Purely Yours.</span></div></div>
    <section className="section"><div className="container" style={{maxWidth:800}}>
      <div className="eyebrow">Saved for later</div><h1 style={{color:'var(--burgundy)'}}>My wishlist</h1>
      {product ? <p className="muted">The product has been saved to this browser’s wishlist.</p> : null}
      {savedProducts.length ? <div style={{display:'grid',gap:12,marginTop:24}}>{savedProducts.map(slug => <div key={slug} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,padding:18,border:'1px solid #eadfd8',borderRadius:14,background:'#fff'}}><Link href={`/shop/${slug}`} style={{fontWeight:700,textTransform:'capitalize'}}>{slug.replaceAll('-', ' ')}</Link><button className="btn btn-outline" onClick={() => remove(slug)}>Remove</button></div>)}</div> : <div className="empty"><h3>Your wishlist is empty.</h3><p>Save a product from the featured products carousel to find it here later.</p><Link className="btn btn-primary" href="/shop">Explore products</Link></div>}
    </div></section>
  </main>
}
