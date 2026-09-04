import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const categories = [
  ['🌾', 'Flours', 'Plantain Flour and Poundo Yam Flour for convenient everyday meals.'],
  ['🥣', 'Breakfast & Mixes', 'Easy, nourishing blends made for busy Nigerian homes.'],
  ['🌶️', 'Spices & Powders', 'Natural powders that add depth, flavour and convenience.'],
  ['🛒', 'Grains & Pantry', 'Trusted pantry staples selected with care.'],
  ['🥕', 'Fresh Produce', 'Wholesome produce for homes, food vendors and businesses.'],
  ['🍵', 'Tea & Wellness', 'Simple plant-based choices for everyday living.'],
]

const promises = [
  { title: 'NATURAL', description: 'Thoughtfully selected ingredients and food products.', icon: 'leaf' },
  { title: 'QUALITY', description: 'Careful processing and packaging standards.', icon: 'shield' },
  { title: 'CONVENIENCE', description: 'Practical products that make everyday cooking easier.', icon: 'sparkles' },
  { title: 'TRUST', description: 'A customer-first experience from order to delivery.', icon: 'heart' },
]

function PromiseIcon({ type }: { type: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (type === 'leaf') return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><path d="M20.5 3.5C12 3.8 6.2 6.1 4.1 11.1c-1.2 2.9.1 6.2 3 7.1 3.3 1 6.4-.8 7.6-3.8C16.2 10.9 15 8.5 20.5 3.5Z"/><path d="M4.5 20.5c2.4-4.2 5.4-7 9.6-9.6"/></svg>
  if (type === 'shield') return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><path d="M12 3.5 19 6v5.1c0 4.5-2.8 7.7-7 9.4-4.2-1.7-7-4.9-7-9.4V6l7-2.5Z"/><path d="m8.8 12 2.1 2.1 4.5-4.5"/></svg>
  if (type === 'sparkles') return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4L11 7.5 12 3Z"/><path d="m19 13 .7 2.3L22 16l-2.3.7L19 19l-.7-2.3L16 16l2.3-.7L19 13Z"/><path d="m5 14 .6 1.8L7.5 16l-1.9.7L5 18.5l-.6-1.8L2.5 16l1.9-.7L5 14Z"/></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><path d="M20.8 8.8c0 5.2-8.8 10-8.8 10s-8.8-4.8-8.8-10C3.2 6 5.3 4 8 4c1.8 0 3.3.9 4 2.3C12.7 4.9 14.2 4 16 4c2.7 0 4.8 2 4.8 4.8Z"/></svg>
}

export default async function Home() {
  const supabase = await createClient()
  const { data: products } = await supabase.from('products').select('id,name,slug,description,price,image_url,featured').eq('is_active', true).eq('featured', true).order('created_at', { ascending: false }).limit(4)
  return (
    <main>
      <div className="topbar"><div className="container"><span>Better Ingredients. Better Processing. Better Experience.</span><span>Serving homes & businesses across Nigeria</span></div></div>
      <header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><div><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium circular logo" /></div><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/account">My Account</Link><Link className="btn btn-primary" href="/shop">Shop Now</Link></nav></div></header>
      <section className="hero"><div className="container hero-grid"><div><div className="eyebrow">Welcome to Folus Emporium</div><h1>Good food starts with <em>good ingredients.</em></h1><p>We curate and package quality food products and kitchen essentials designed to make everyday living simpler, better and more intentional.</p><div className="hero-actions"><Link className="btn btn-primary" href="/shop">Explore the Collection</Link><a className="btn btn-outline" href="https://wa.me/2349168157255">Chat on WhatsApp</a></div></div><div className="hero-card"><div className="quote"><div className="eyebrow">Our promise</div><strong>Better ingredients. Better processing. Better experience.</strong><p>From pantry staples to convenient mixes, every product is curated with care.</p></div></div></div></section>
      <section className="section"><div className="container"><div className="section-head"><div><div className="eyebrow">Explore</div><h2>Shop by category</h2></div><p>Discover convenient food products and essentials created for households, food vendors, restaurants, supermarkets and more.</p></div><div className="categories">{categories.map(([icon,title,desc]) => <Link className="category" href={`/shop?category=${encodeURIComponent(title)}`} key={title}><div className="icon">{icon}</div><h3>{title}</h3><p>{desc}</p></Link>)}</div></div></section>
      <section className="section promise"><div className="container"><div className="section-head"><div><div className="eyebrow">Why Folus Emporium</div><h2 style={{color:'#fff'}}>Curated with intention.</h2></div></div><div className="promise-grid">{promises.map((promise) => <div className="promise-card" key={promise.title}><div className="promise-icon"><PromiseIcon type={promise.icon} /></div><b>{promise.title}</b><p>{promise.description}</p></div>)}</div></div></section>
      <section className="section"><div className="container"><div className="section-head"><div><div className="eyebrow">Featured</div><h2>Our product collection</h2></div><Link className="btn btn-outline" href="/shop">View all products</Link></div>{products?.length ? <div className="products">{products.map((p) => <article className="product-card" key={p.id}><div className="product-image">{p.image_url ? <img src={p.image_url} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : p.name}</div><div className="product-body"><span className="status">Available for catalogue setup</span><h3>{p.name}</h3><p>{p.description}</p><strong>{Number(p.price) > 0 ? `₦${Number(p.price).toLocaleString('en-NG')}` : 'Price to be updated'}</strong></div></article>)}</div> : <div className="empty"><h3>Our collection is being prepared.</h3><p>Product catalogue setup is underway. Check the Shop page as we continue adding the collection.</p><Link className="btn btn-primary" href="/shop">Visit Shop</Link></div>}</div></section>
      <section className="cta"><div className="container"><div className="cta-box"><div><div className="eyebrow">For homes & businesses</div><h2>Let's make better food choices easier.</h2></div><Link className="btn btn-primary" href="/shop">Start Shopping</Link></div></div></section>
      <footer className="footer"><div className="container footer-grid"><div><h3>Folus Emporium Ltd</h3><p>Nature’s Goodness, Purely Yours.</p><p>Curating Excellence for Life’s Finest Moments.</p></div><div><h3>Quick Links</h3><p><Link href="/shop">Shop</Link><br/><Link href="/account">My Account</Link></p></div><div><h3>Let's Connect</h3><p><a href="https://wa.me/2349168157255">WhatsApp: 0916 815 7255</a><br/><a href="https://instagram.com/folusemporiumltd">Instagram: @folusemporiumltd</a></p></div></div><div className="container copyright">© 2026 Folus Emporium Ltd. All rights reserved.</div></footer>
    </main>
  )
}
