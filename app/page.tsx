import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createCatalogueClient } from '@/lib/supabase/server'
import ProductCardActions from '@/components/product-card-actions'
import { StorefrontHeader } from '@/components/storefront-ui'
import FeaturedProductCarousel from '@/components/featured-product-carousel'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const categories = [
  ['🌾', 'Flours', 'flours', 'Plantain Flour and Poundo Yam Flour for convenient everyday meals.'],
  ['🥣', 'Breakfast & Mixes', 'breakfast-mixes', 'Easy, nourishing blends made for busy Nigerian homes.'],
  ['🌶️', 'Spices & Powders', 'spices-powders', 'Natural powders that add depth, flavour and convenience.'],
  ['🛒', 'Grains & Pantry', 'grains-pantry', 'Trusted pantry staples selected with care.'],
  ['🥕', 'Fresh Produce', 'fresh-produce', 'Wholesome produce for homes, food vendors and businesses.'],
  ['🍵', 'Tea & Wellness', 'tea-wellness', 'Simple plant-based choices for everyday living.'],
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

function ContactIcon({ type }: { type: 'email' | 'phone' | 'whatsapp' | 'address' }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (type === 'email') return <svg viewBox="0 0 24 24" {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>
  if (type === 'phone') return <svg viewBox="0 0 24 24" {...common}><path d="M6.8 3.8 9.3 7l-1.6 2.1c1.2 2.5 2.9 4.2 5.4 5.4l2.1-1.6 3.2 2.5-1.5 3.1c-.4.8-1.3 1.2-2.2 1-6.5-1.6-11.8-6.9-13.4-13.4-.2-.9.2-1.8 1-2.2l3.1-1.5Z"/></svg>
  if (type === 'whatsapp') return <svg viewBox="0 0 24 24" {...common}><path d="M20 11.6A8 8 0 0 1 8.2 18.7L4 20l1.3-4.1A8 8 0 1 1 20 11.6Z"/><path d="M9.2 8.2c.5 2.9 2.2 4.6 5.1 5.1"/></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><path d="M20 10c0 5.2-8 10.5-8 10.5S4 15.2 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.4"/></svg>
}

const storefrontFallback = {
  announcement: 'Serving homes & businesses across Nigeria.',
  utilityLinks: [['Track Order','/account'],['FAQ','/faq'],['Contact Us','/contact']] as [string,string][],
  social: { facebook: 'https://www.facebook.com/folusemporiumltd', tiktok: 'https://www.tiktok.com/@folusemporium25', whatsapp: 'https://wa.me/2349168157255', instagram: '' },
  navigation: [['Home','/'],['Shop','/shop'],['Categories','/shop'],['About Us','/about'],['Our Story','/about#story'],['Blog','/blog'],['Careers','/careers'],['Contact Us','/contact']] as [string,string][]
}

export default async function Home({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams
  if (params.code) {
    const authClient = await createClient()
    const { error } = await authClient.auth.exchangeCodeForSession(params.code)
    if (!error) redirect('/login?message=Email%20confirmed%20successfully.%20Please%20sign%20in%20to%20continue.&next=%2Fcheckout&mode=signin')
    redirect('/login?error=We%20could%20not%20confirm%20your%20email.%20Please%20request%20a%20new%20confirmation%20email.&next=%2Fcheckout&mode=signin')
  }

  const supabase = await createCatalogueClient()
  const [{ data: products }, { data: storefrontContent }, { data: headerCategories }] = await Promise.all([
    supabase.from('products').select('id,name,slug,description,price,image_url,featured,stock_quantity').eq('is_active', true).order('featured', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('storefront_content').select('config').eq('id', true).maybeSingle(),
    supabase.from('categories').select('name,slug').order('name'),
  ])
  const storefrontConfig = { ...storefrontFallback, ...((storefrontContent?.config ?? {}) as Partial<typeof storefrontFallback>) }
  const productIds = products?.map(p => p.id) ?? []
  const { data: variants } = productIds.length ? await supabase.from('product_variants').select('id,product_id,size_grams,size_label,price,stock_quantity,is_active').in('product_id', productIds).eq('is_active', true).order('size_grams') : { data: [] }
  const defaultVariantByProduct = new Map<string, NonNullable<typeof variants>[number]>()
  for (const variant of variants ?? []) {
    const existing = defaultVariantByProduct.get(variant.product_id)
    if (!existing || Math.abs(variant.size_grams - 500) < Math.abs(existing.size_grams - 500)) defaultVariantByProduct.set(variant.product_id, variant)
  }

  return (
    <main>
      <StorefrontHeader config={storefrontConfig} categories={headerCategories ?? []}/>
      <section className="hero"><div className="container hero-grid"><div><div className="eyebrow">Welcome to Folus Emporium</div><h1>Good food starts with <em>good ingredients.</em></h1><p>We curate and package quality food products and kitchen essentials designed to make everyday living simpler, better and more intentional.</p><div className="hero-actions"><Link className="btn btn-primary" href="/shop">Explore the Collection</Link><a className="btn btn-outline" href="https://wa.me/2349168157255">Chat on WhatsApp</a></div></div><div className="hero-card"><div className="quote"><div className="eyebrow">Our promise</div><strong>Better ingredients. Better processing. Better experience.</strong><p>From fresh farm produce, every product is carefully sourced, processed, and packaged to meet high standards of safety, nutrition, and customer satisfaction.</p></div></div></div></section>
      <section className="section home-featured-section"><div className="container"><div className="section-head"><div><div className="eyebrow">Featured</div><h2>Our product collection</h2></div><Link className="btn btn-outline" href="/shop">View all products</Link></div>{products?.length ? <FeaturedProductCarousel>{products.map((p) => { const variant = defaultVariantByProduct.get(p.id); return <article className="product-card" key={p.id}><Link href={`/shop/${p.slug}`} aria-label={`View ${p.name}`}><div className="product-image">{p.image_url ? <img src={p.image_url} alt={p.name} style={{width:'100%',height:'100%',objectFit:'contain'}}/> : <span>{p.name}</span>}</div></Link><div className="product-body"><span className="status">{p.featured ? 'Featured' : 'Folus collection'} · {variant?.size_label ?? '500g'}</span><h3><Link href={`/shop/${p.slug}`}>{p.name}</Link></h3><p>{p.description}</p><strong>{variant && Number(variant.price) > 0 ? `₦${Number(variant.price).toLocaleString('en-NG')}` : Number(p.price) > 0 ? `₦${Number(p.price).toLocaleString('en-NG')}` : 'Price to be updated'}</strong><ProductCardActions product={p} variant={variant}/></div></article> })}</FeaturedProductCarousel> : <div className="empty"><h3>Our collection is being prepared.</h3><p>Product catalogue setup is underway. Check the Shop page as we continue adding the collection.</p><Link className="btn btn-primary" href="/shop">Visit Shop</Link></div>}</div></section>
      <div className="container home-section-divider" aria-hidden="true"/>
      <section className="section home-category-section"><div className="container"><div className="section-head"><div><div className="eyebrow">Explore</div><h2>Shop by category</h2></div><p>Discover convenient food products and essentials created for households, food vendors, restaurants, supermarkets and more.</p></div><div className="categories">{categories.map(([icon,title,slug,desc]) => <Link className="category" href={`/shop?category=${slug}`} key={title}><div className="icon">{icon}</div><h3>{title}</h3><p>{desc}</p></Link>)}</div></div></section>
      <section className="section promise"><div className="container"><div className="section-head"><div><div className="eyebrow">Why Folus Emporium</div><h2 style={{color:'#fff'}}>Curated with intention.</h2></div></div><div className="promise-grid">{promises.map((promise) => <div className="promise-card" key={promise.title}><div className="promise-icon"><PromiseIcon type={promise.icon} /></div><b>{promise.title}</b><p>{promise.description}</p></div>)}</div></div></section>
      <section className="cta"><div className="container"><div className="cta-box"><div><div className="eyebrow">For homes & businesses</div><h2>Let's make better food choices easier.</h2></div><Link className="btn btn-primary" href="/shop">Start Shopping</Link></div></div></section>
      <footer className="footer luxury-footer">
        <div className="container footer-links-grid">
          <div><h3>Company</h3><Link href="/about">About Us</Link><Link href="/about#story">Our Story</Link><Link href="/blog">Blog</Link><Link href="/careers">Careers</Link></div>
          <div><h3>Shop</h3><Link href="/shop">All Products</Link><Link href="/shop">Categories</Link><Link href="/shop?featured=true">Best Sellers</Link><Link href="/shop?new=true">New Arrivals</Link></div>
          <div><h3>Customer Service</h3><Link href="/contact">Contact Us</Link><Link href="/faq">FAQs</Link><Link href="/shipping-policy">Shipping Policy</Link><Link href="/return-policy">Return Policy</Link></div>
          <div><h3>My Account</h3><Link href="/login">Login</Link><Link href="/login?mode=signup">Register</Link><Link href="/wishlist">Wishlist</Link><Link href="/account">Order Tracking</Link></div>
          <div className="footer-contact"><h3>Contact Information</h3><a href="mailto:folusemporium@gmail.com"><ContactIcon type="email"/>folusemporium@gmail.com</a><a href="mailto:info@folusemporium.com"><ContactIcon type="email"/>info@folusemporium.com</a><a href="tel:+2349168157255"><ContactIcon type="phone"/>+234 916 815 7255</a><a href="https://wa.me/2349168157255"><ContactIcon type="whatsapp"/>+234 916 815 7255</a><p><ContactIcon type="address"/>Alarere, Ibadan, Oyo State</p></div>
        </div>
        <div className="container footer-social-row"><div><b>Follow Folus Emporium</b><div className="footer-socials"><a href="https://www.facebook.com/folusemporiumltd" aria-label="Facebook">f</a><span aria-label="Instagram">◎</span><a href="https://www.tiktok.com/@folusemporium25" aria-label="TikTok">♪</a><span aria-label="YouTube">▶</span><span aria-label="LinkedIn">in</span></div></div><div className="footer-payment-logos" role="group" aria-label="Accepted payment methods" style={{display:'flex',alignItems:'center',flexWrap:'nowrap',gap:14,padding:'10px 12px',background:'#fffdf9',border:'1px solid #e2ad46',borderRadius:8,maxWidth:'100%',boxSizing:'border-box'}}><img src="/Paystack.png" alt="Paystack" width={116} height={28} style={{display:'block',width:116,height:28,objectFit:'cover',flexShrink:1,minWidth:0,mixBlendMode:'multiply'}}/><img src="/visa-and-mastercard-logo-26.png" alt="Visa and Mastercard" width={132} height={34} style={{display:'block',width:132,height:34,objectFit:'contain',flexShrink:1,minWidth:0,mixBlendMode:'multiply'}}/></div></div>
        <div className="container copyright footer-bottom"><img src="https://boaaiskncrfmaismhqno.supabase.co/storage/v1/object/public/product-images/folus-emporium-horizontal-logo.png" alt="Folus Emporium"/><span>© 2026 Folus Emporium. All Rights Reserved.</span></div>
      </footer>
    </main>
  )
}
