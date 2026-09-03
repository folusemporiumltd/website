import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AddToCart from '@/components/add-to-cart'
import CartLink from '@/components/cart-link'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: product } = await supabase.from('products').select('id,name,slug,description,price,image_url,stock_quantity,featured').eq('slug', slug).eq('is_active', true).single()
  if (!product) notFound()

  return <main><div className="topbar"><div className="container"><span>Better Ingredients. Better Processing. Better Experience.</span><span>Serving homes & businesses across Nigeria</span></div></div><header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/brand/folus-emporium-logo.jpg" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Curating Excellence</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><CartLink/><Link href="/account">My Account</Link></nav></div></header><section className="section"><div className="container" style={{maxWidth:1000}}><Link href="/shop" style={{color:'var(--burgundy)',fontWeight:700}}>← Back to shop</Link><div className="hero-grid" style={{marginTop:30}}><div className="product-image product-detail-image">{product.image_url ? <img src={product.image_url} alt={product.name}/> : <span>{product.name}</span>}</div><div><div className="eyebrow">{product.featured ? 'Featured · Folus Emporium' : 'Folus Emporium'}</div><h1 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(40px,6vw,52px)',color:'var(--burgundy)',margin:'12px 0'}}>{product.name}</h1><p style={{fontSize:17,lineHeight:1.8,color:'var(--muted)'}}>{product.description}</p><div style={{fontSize:28,fontWeight:800,margin:'25px 0'}}>{Number(product.price)>0 ? `₦${Number(product.price).toLocaleString('en-NG')}` : 'Price to be updated'}</div><p className="status">{product.stock_quantity>0 ? `${product.stock_quantity} in stock` : 'Stock to be updated'}</p><div className="hero-actions"><AddToCart product={product}/><Link className="btn btn-outline" href="/cart">View cart</Link></div></div></div></div></section></main>
}
