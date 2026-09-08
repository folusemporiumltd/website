import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductCardActions from '@/components/product-card-actions'
import { HeroCarousel, StorefrontHeader, TrustIcon } from '@/components/storefront-ui'

type Variant = { id: string; product_id: string; size_grams: number; size_label: string; price: number; stock_quantity: number; is_active: boolean }
type Product = { id: string; name: string; slug: string; description: string | null; price: number; image_url: string | null; featured: boolean; stock_quantity: number }
const fallback = { announcement: 'Serving homes & businesses across Nigeria.', utilityLinks: [['Track Order','/account'],['FAQ','#faq'],['Contact Us','/contact']], social: { facebook: 'https://www.facebook.com/folusemporiumltd', tiktok: 'https://www.tiktok.com/@folusemporium25', whatsapp: 'https://wa.me/2349168157255', instagram: '' }, navigation: [['Home','/'],['Shop','/shop'],['Categories','/shop'],['About Us','/about'],['Blog','/blog'],['Contact Us','/contact']], trust: [['100% Natural','No preservatives','leaf'],['Premium Quality','Carefully sourced','shield'],['Fast Delivery','Across Nigeria','truck'],['Dedicated Support',"We're here to help",'support']], slides: [] as {title:string;text:string;cta:string;href:string;image:string}[] }

export default async function Home({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code)
    if (!error) redirect('/login?message=Email%20confirmed%20successfully.%20Please%20sign%20in%20to%20continue.&next=%2Fcheckout&mode=signin')
    redirect('/login?error=We%20could%20not%20confirm%20your%20email.%20Please%20request%20a%20new%20confirmation%20email.&next=%2Fcheckout&mode=signin')
  }

  const [{ data: content }, { data: products }, { data: categories }] = await Promise.all([
    supabase.from('storefront_content').select('config').eq('id', true).maybeSingle(),
    supabase.from('products').select('id,name,slug,description,price,image_url,featured,stock_quantity').eq('is_active', true).eq('featured', true).order('created_at', { ascending: false }).limit(8),
    supabase.from('categories').select('name,slug').order('name')
  ])
  const config = { ...fallback, ...((content?.config ?? {}) as Partial<typeof fallback>) }
  const featured = (products ?? []) as Product[]
  const productIds = featured.map(item => item.id)
  const { data: variants } = productIds.length ? await supabase.from('product_variants').select('id,product_id,size_grams,size_label,price,stock_quantity,is_active').in('product_id', productIds).eq('is_active', true).order('size_grams') : { data: [] as Variant[] }
  const defaultVariant = new Map<string, Variant>()
  for (const variant of (variants ?? []) as Variant[]) { const current = defaultVariant.get(variant.product_id); if (!current || Math.abs(variant.size_grams - 500) < Math.abs(current.size_grams - 500)) defaultVariant.set(variant.product_id, variant) }

  return <main>
    <StorefrontHeader config={config} categories={categories ?? []}/>
    <HeroCarousel slides={config.slides}/>
    <section className="trust-bar"><div className="container trust-grid">{config.trust.map(([title, description, icon]) => <div className="trust-item" key={title}><div className="trust-icon"><TrustIcon name={icon}/></div><div><b>{title}</b><span>{description}</span></div></div>)}</div></section>
    <section className="section featured-section"><div className="container"><div className="featured-heading"><div><div className="eyebrow">Our selection</div><h2>Featured Products</h2></div><Link href="/shop">View all products <span>→</span></Link></div>
    {featured.length ? <div className="featured-products">{featured.map(product => { const variant = defaultVariant.get(product.id); const price = variant && Number(variant.price) > 0 ? Number(variant.price) : Number(product.price); return <article className="luxury-product-card" key={product.id}><Link className="product-card-link" href={'/shop/' + product.slug} aria-label={'View ' + product.name}><div className="luxury-product-image">{product.image_url ? <img src={product.image_url} alt={product.name}/> : <span>{product.name}</span>}<span className="weight-badge">{variant?.size_label ?? '500g'}</span></div></Link><div className="luxury-product-body"><div className="product-name-row"><h3><Link href={'/shop/' + product.slug}>{product.name}</Link></h3><Link className="wishlist-control" href={'/wishlist?product=' + product.slug} aria-label={'Add ' + product.name + ' to wishlist'}>♡</Link></div><strong>{price > 0 ? '₦' + price.toLocaleString('en-NG') : 'Price to be updated'}</strong><ProductCardActions product={product} variant={variant}/></div></article> })}</div> : <p className="muted">Featured products will appear here as they are added.</p>}</div></section>
    <section className="section home-intro"><div className="container intro-grid"><div><div className="eyebrow">Welcome to Folus Emporium</div><h2>Good food starts with good ingredients.</h2><p>We curate and package quality food products and kitchen essentials designed to make everyday living simpler, better and more intentional.</p><Link className="btn btn-primary" href="/shop">Explore the Collection</Link></div><div className="promise-panel"><div className="eyebrow">Our promise</div><h2>Better ingredients. Better processing. Better experience.</h2><p>Every product is thoughtfully sourced, processed and packaged with high standards of safety, nutrition and customer satisfaction.</p></div></div></section>
  </main>
}