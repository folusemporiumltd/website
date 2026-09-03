import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ShopPage() {
  const supabase = await createClient()
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('products').select('id,name,slug,description,price,image_url,featured').eq('is_active', true).order('featured', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('categories').select('name,slug').order('name'),
  ])

  return (
    <main>
      <div className="topbar"><div className="container"><span>Better Ingredients. Better Processing. Better Experience.</span><span>Serving homes & businesses across Nigeria</span></div></div>
      <header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/brand/folus-emporium-logo.jpg" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/account">My Account</Link></nav></div></header>
      <section className="shop-hero"><div className="container"><div className="eyebrow">The collection</div><h1 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(40px,6vw,62px)',color:'var(--burgundy)',margin:'12px 0'}}>Shop Folus Emporium</h1><p style={{color:'var(--muted)',maxWidth:680,fontSize:17,lineHeight:1.7}}>Explore our growing collection of thoughtfully curated food products and kitchen essentials.</p></div></section>
      <section className="section" style={{paddingTop:20}}><div className="container shop-layout"><aside className="filter"><h3>Categories</h3>{categories?.map(c => <Link key={c.slug} href={`/shop?category=${c.slug}`}>{c.name}</Link>)}</aside><div>{products?.length ? <div className="products">{products.map(p => <article className="product-card" key={p.id}><div className="product-image">{p.image_url ? <img src={p.image_url} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span>{p.name}</span>}</div><div className="product-body"><span className="status">Catalogue item</span><h3>{p.name}</h3><p>{p.description}</p><strong>{Number(p.price) > 0 ? `₦${Number(p.price).toLocaleString('en-NG')}` : 'Price to be updated'}</strong><Link className="btn btn-outline" href={`/shop/${p.slug}`}>View product</Link></div></article>)}</div> : <div className="empty"><h3>Catalogue loading</h3><p>We are preparing the collection for you.</p></div>}</div></div></section>
      <footer className="footer"><div className="container footer-grid"><div><h3>Folus Emporium Ltd</h3><p>Nature’s Goodness, Purely Yours.</p></div><div><h3>Quick Links</h3><p><Link href="/">Home</Link><br/><Link href="/account">My Account</Link></p></div><div><h3>Connect</h3><p><a href="https://wa.me/2349168157255">WhatsApp: 0916 815 7255</a></p></div></div></footer>
    </main>
  )
}
