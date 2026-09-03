import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: product } = await supabase.from('products').select('id,name,slug,description,price,image_url,stock_quantity,featured').eq('slug', slug).eq('is_active', true).single()
  if (!product) notFound()

  return <main><header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/brand/folus-emporium-logo.jpg" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/account">My Account</Link></nav></div></header><section className="section"><div className="container" style={{maxWidth:1000}}><Link href="/shop" style={{color:'var(--burgundy)',fontWeight:700}}>← Back to shop</Link><div className="hero-grid" style={{marginTop:30}}><div className="product-image" style={{borderRadius:24,minHeight:520}}>{product.image_url ? <img src={product.image_url} alt={product.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : product.name}</div><div><div className="eyebrow">Folus Emporium</div><h1 style={{fontFamily:'Playfair Display,serif',fontSize:52,color:'var(--burgundy)',margin:'12px 0'}}>{product.name}</h1><p style={{fontSize:17,lineHeight:1.8,color:'var(--muted)'}}>{product.description}</p><div style={{fontSize:28,fontWeight:800,margin:'25px 0'}}>{Number(product.price)>0 ? `₦${Number(product.price).toLocaleString('en-NG')}` : 'Price to be updated'}</div><p className="status">{product.stock_quantity>0 ? `${product.stock_quantity} in stock` : 'Catalogue item — stock to be updated'}</p><div className="hero-actions"><Link className="btn btn-primary" href="https://wa.me/2349168157255">Enquire on WhatsApp</Link><Link className="btn btn-outline" href="/shop">Continue shopping</Link></div></div></div></div></section></main>
}
