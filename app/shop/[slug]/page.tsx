import Link from 'next/link'
import {notFound} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import ProductVariantPicker from '@/components/product-variant-picker'
import CartLink from '@/components/cart-link'
import SocialShare from '@/components/social-share'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params
 const s=await createClient()
 const {data,error}=await s.rpc('get_public_product_detail',{p_slug:slug})
 const detail=data as any
 const p=detail?.product
 const v=Array.isArray(detail?.variants)?detail.variants:[]
 if(error||!p)notFound()
 return <main><div className="topbar"><div className="container"><span>Better Ingredients. Better Processing. Better Experience.</span><span>Serving homes & businesses across Nigeria</span></div></div><header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium"/><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><CartLink/><Link href="/account">My Account</Link></nav></div></header><section className="section"><div className="container" style={{maxWidth:1000}}><Link href="/shop" style={{color:'var(--burgundy)',fontWeight:700}}>← Back to shop</Link><div className="hero-grid" style={{marginTop:30}}><div className="product-image product-detail-image">{p.image_url?<img src={p.image_url} alt={`Folus Emporium ${p.name}`}/>:<span>{p.name}</span>}</div><div><div className="eyebrow">{p.featured?'Featured · Folus Emporium':'Folus Emporium'}</div><h1 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(40px,6vw,52px)',color:'var(--burgundy)',margin:'12px 0'}}>{p.name}</h1><p style={{fontSize:17,lineHeight:1.8,color:'var(--muted)'}}>{p.description}</p><ProductVariantPicker product={p} variants={v}/><SocialShare title={p.name} path={`/shop/${p.slug}`}/><p className="muted" style={{marginTop:18}}>Need help? <a href="https://wa.me/2349168157255">Chat with us on WhatsApp</a>.</p></div></div></div></section></main>
}
