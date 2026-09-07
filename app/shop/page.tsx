import Link from 'next/link'
import { createServiceRoleClient } from '@/lib/supabase/server'
import CartLink from '@/components/cart-link'
import ProductCardActions from '@/components/product-card-actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Product = { id: string; name: string; slug: string; description: string | null; price: number; image_url: string | null; featured: boolean; stock_quantity: number; category_id: string | null; default_size_grams: number | null }
type Category = { id: string; name: string; slug: string }
type Variant = { id: string; product_id: string; size_grams: number; size_label: string; price: number; stock_quantity: number; is_active: boolean }

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams
  // Catalogue reads run server-side with the service-role client. The key is never sent to the browser.
  // This prevents public RLS/auth state from incorrectly hiding the active catalogue.
  const supabase = createServiceRoleClient()

  const [productsResult, categoriesResult, variantsResult] = await Promise.all([
    supabase.from('products').select('id,name,slug,description,price,image_url,featured,stock_quantity,category_id,default_size_grams').eq('is_active', true).order('featured', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('categories').select('id,name,slug').order('name'),
    supabase.from('product_variants').select('id,product_id,size_grams,size_label,price,stock_quantity,is_active').eq('is_active', true).order('size_grams'),
  ])

  if (productsResult.error) console.error('[shop] products query failed:', productsResult.error)
  if (categoriesResult.error) console.error('[shop] categories query failed:', categoriesResult.error)
  if (variantsResult.error) console.error('[shop] variants query failed:', variantsResult.error)

  const products = (productsResult.data ?? []) as Product[]
  const categories = (categoriesResult.data ?? []) as Category[]
  const variants = (variantsResult.data ?? []) as Variant[]

  const selectedCategory = category ? categories.find(c => c.slug === category) : null
  const filteredProducts = selectedCategory ? products.filter(p => p.category_id === selectedCategory.id) : products

  const defaultVariantByProduct = new Map<string, Variant>()
  for (const variant of variants) {
    const existing = defaultVariantByProduct.get(variant.product_id)
    if (!existing || Math.abs(variant.size_grams - 500) < Math.abs(existing.size_grams - 500)) defaultVariantByProduct.set(variant.product_id, variant)
  }

  return <main><div className="topbar"><div className="container"><span>Better Ingredients. Better Processing. Better Experience.</span><span>Serving homes & businesses across Nigeria</span></div></div><header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium circular logo"/><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><CartLink/><Link href="/account">My Account</Link></nav></div></header><section className="shop-hero"><div className="container"><div className="eyebrow">The collection</div><h1 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(40px,6vw,62px)',color:'var(--burgundy)',margin:'12px 0'}}>Shop Folus Emporium</h1><p style={{color:'var(--muted)',maxWidth:680,fontSize:17,lineHeight:1.7}}>Explore our growing collection of thoughtfully curated food products and kitchen essentials.</p></div></section><section className="section" style={{paddingTop:20}}><div className="container shop-layout"><aside className="filter"><h3>Categories</h3><Link href="/shop" className={!selectedCategory ? 'active' : ''}>All products</Link>{categories.map(c => <Link className={selectedCategory?.slug === c.slug ? 'active' : ''} key={c.slug} href={`/shop?category=${c.slug}`}>{c.name}</Link>)}</aside><div><div className="section-head" style={{marginBottom:24}}><div><div className="eyebrow">{selectedCategory?.name ?? 'All products'}</div><h2>{filteredProducts.length} products</h2></div></div>{filteredProducts.length ? <div className="products">{filteredProducts.map(p => { const variant = defaultVariantByProduct.get(p.id); return <article className="product-card" key={p.id}><div className="product-image">{p.image_url ? <img src={p.image_url} alt={p.name}/> : <span>{p.name}</span>}</div><div className="product-body"><span className="status">{p.featured ? 'Featured' : 'Folus collection'} · {variant?.size_label ?? `${p.default_size_grams ?? 500}g`}</span><h3>{p.name}</h3><p>{p.description}</p><strong>{variant && Number(variant.price) > 0 ? `₦${Number(variant.price).toLocaleString('en-NG')}` : Number(p.price) > 0 ? `₦${Number(p.price).toLocaleString('en-NG')}` : 'Price to be updated'}</strong><ProductCardActions product={p} variant={variant}/></div></article> })}</div> : <div className="empty"><h3>No products in this category yet.</h3><p>Explore all products while we continue expanding the collection.</p><Link className="btn btn-primary" href="/shop">View all products</Link></div>}</div></div></section><footer className="footer"><div className="container footer-grid"><div><h3>Folus Emporium Ltd</h3><p>Nature’s Goodness, Purely Yours.</p><p>Curating Excellence for Life’s Finest Moments.</p></div><div><h3>Quick Links</h3><p><Link href="/">Home</Link><br/><Link href="/account">My Account</Link></p></div><div><h3>Connect</h3><p><a href="https://wa.me/2349168157255">WhatsApp: 0916 815 7255</a></p></div></div></footer></main>
}
