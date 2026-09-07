import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductVariantPicker from '@/components/product-variant-picker'
import CartLink from '@/components/cart-link'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: product } = await supabase.from('products').select('id,name,slug,description,price,image_url,stock_quantity,featured').eq('slug', slug).eq('is_active', true).single()
  if (!product) notFound()
  const { data: variants } = await supabase.from('product_variants').select('id,size_grams,size_label,price,stock_quantity').eq('product_id', product.id).eq('is_active', true).order('size_grams')

  return <main><div className="topbar"><div className="container"><span>Better Ingredients. Better Processing. Better Experience.</span><span>Serving homes & businesses across Nigeria</span></div></div><header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium circular logo"/><span>FOLUS<br/>EMPORIUM<small>Curating Excellence</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><CartLink/><Link href="/account">My Account</Link></nav></div></header><section className="section"><div className="container" style={{maxWidth:1000}}><Link href="/shop" style={{color:'var(--burgundy)',fontWeight:700}}>← Back to shop</Link><div className="hero-grid" style={{marginTop:30}}><div className="product-image product-detail-image">{product.image_url ? <img src={product.image_url} alt={`Folus Emporium ${product.name}`}/> : <span>{product.name}</span>}</div><div><div className="eyebrow">{product.featured ? 'Featured · Folus Emporium' : 'Folus Emporium'}</div><h1 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(40px,6vw,52px)',color:'var(--burgundy)',margin:'12px 0'}}>{product.name}</h1><p style={{fontSize:17,lineHeight:1.8,color:'var(--muted)'}}>{product.description}</p><div className="status" style={{margin:'16px 0'}}>Choose the size that suits your needs. Prices and availability are shown for each size.</div><ProductVariantPicker product={product} variants={variants ?? []}/><p className="muted" style={{marginTop:18}}>Need help choosing a size? <a href="https://wa.me/2349168157255">Chat with us on WhatsApp</a>.</p></div></div></div></section></main>
}
