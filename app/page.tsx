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

export default async function Home() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id,name,slug,description,price,image_url,featured')
    .eq('is_active', true)
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(4)

  return (
    <main>
      <div className="topbar"><div className="container"><span>Better Ingredients. Better Processing. Better Experience.</span><span>Serving homes & businesses across Nigeria</span></div></div>
      <header className="nav"><div className="container nav-inner">
        <Link className="brand" href="/"><div><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium circular logo" /></div><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link>
        <nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/account">My Account</Link><Link className="btn btn-primary" href="/shop">Shop Now</Link></nav>
      </div></header>

      <section className="hero"><div className="container hero-grid">
        <div><div className="eyebrow">Welcome to Folus Emporium</div><h1>Good food starts with <em>good ingredients.</em></h1><p>We curate and package quality food products and kitchen essentials designed to make everyday living simpler, better and more intentional.</p><div className="hero-actions"><Link className="btn btn-primary" href="/shop">Explore the Collection</Link><a className="btn btn-outline" href="https://wa.me/2349168157255">Chat on WhatsApp</a></div></div>
        <div className="hero-card"><div className="quote"><div className="eyebrow">Our promise</div><strong>Better ingredients. Better processing. Better experience.</strong><p>From pantry staples to convenient mixes, every product is curated with care.</p></div></div>
      </div></section>

      <section className="section"><div className="container"><div className="section-head"><div><div className="eyebrow">Explore</div><h2>Shop by category</h2></div><p>Discover convenient food products and essentials created for households, food vendors, restaurants, supermarkets and more.</p></div><div className="categories">{categories.map(([icon,title,desc]) => <Link className="category" href={`/shop?category=${encodeURIComponent(title)}`} key={title}><div className="icon">{icon}</div><h3>{title}</h3><p>{desc}</p></Link>)}</div></div></section>

      <section className="section promise"><div className="container"><div className="section-head"><div><div className="eyebrow">Why Folus Emporium</div><h2 style={{color:'#fff'}}>Curated with intention.</h2></div></div><div className="promise-grid"><div className="promise-card"><b>01 · NATURAL</b><p>Thoughtfully selected ingredients and food products.</p></div><div className="promise-card"><b>02 · QUALITY</b><p>Careful processing and packaging standards.</p></div><div className="promise-card"><b>03 · CONVENIENCE</b><p>Practical products that make everyday cooking easier.</p></div><div className="promise-card"><b>04 · TRUST</b><p>A customer-first experience from order to delivery.</p></div></div></div></section>

      <section className="section"><div className="container"><div className="section-head"><div><div className="eyebrow">Featured</div><h2>Our product collection</h2></div><Link className="btn btn-outline" href="/shop">View all products</Link></div>{products?.length ? <div className="products">{products.map((p) => <article className="product-card" key={p.id}><div className="product-image">{p.image_url ? <img src={p.image_url} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : p.name}</div><div className="product-body"><span className="status">Available for catalogue setup</span><h3>{p.name}</h3><p>{p.description}</p><strong>{Number(p.price) > 0 ? `₦${Number(p.price).toLocaleString('en-NG')}` : 'Price to be updated'}</strong></div></article>)}</div> : <div className="empty"><h3>Our collection is being prepared.</h3><p>Product catalogue setup is underway. Check the Shop page as we continue adding the collection.</p><Link className="btn btn-primary" href="/shop">Visit Shop</Link></div>}</div></section>

      <section className="cta"><div className="container"><div className="cta-box"><div><div className="eyebrow">For homes & businesses</div><h2>Let's make better food choices easier.</h2></div><Link className="btn btn-primary" href="/shop">Start Shopping</Link></div></div></section>

      <footer className="footer"><div className="container footer-grid"><div><h3>Folus Emporium Ltd</h3><p>Nature’s Goodness, Purely Yours.</p><p>Curating Excellence for Life’s Finest Moments.</p></div><div><h3>Quick Links</h3><p><Link href="/shop">Shop</Link><br/><Link href="/account">My Account</Link></p></div><div><h3>Let's Connect</h3><p><a href="https://wa.me/2349168157255">WhatsApp: 0916 815 7255</a><br/><a href="https://instagram.com/folusemporiumltd">Instagram: @folusemporiumltd</a></p></div></div><div className="container copyright">© 2026 Folus Emporium Ltd. All rights reserved.</div></footer>
    </main>
  )
}
