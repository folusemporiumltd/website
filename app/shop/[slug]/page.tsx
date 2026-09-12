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
 const {data:reviews}=await s.from('product_reviews').select('id,rating,title,review,reviewer_name,created_at').eq('product_id',p.id).eq('status','approved').order('created_at',{ascending:false})
 const average=reviews?.length?reviews.reduce((sum:number,r:any)=>sum+Number(r.rating),0)/reviews.length:0
 return <main><div className="topbar"><div className="container"><span>Better Ingredients. Better Processing. Better Experience.</span><span>Serving homes & businesses across Nigeria</span></div></div><header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium"/><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><CartLink/><Link href="/account">My Account</Link></nav></div></header><section className="section"><div className="container" style={{maxWidth:1000}}><Link href="/shop" style={{color:'var(--burgundy)',fontWeight:700}}>← Back to shop</Link><div className="hero-grid" style={{marginTop:30}}><div className="product-image product-detail-image">{p.image_url?<img src={p.image_url} alt={`Folus Emporium ${p.name}`}/>:<span>{p.name}</span>}</div><div><div className="eyebrow">{p.featured?'Featured · Folus Emporium':'Folus Emporium'}</div><h1 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(40px,6vw,52px)',color:'var(--burgundy)',margin:'12px 0'}}>{p.name}</h1>{reviews?.length?<p style={{color:'#a67612',fontWeight:800}}>{'★'.repeat(Math.round(average))}{'☆'.repeat(5-Math.round(average))} <span style={{color:'var(--muted)',fontWeight:600}}>{average.toFixed(1)} from {reviews.length} review{reviews.length===1?'':'s'}</span></p>:null}<p style={{fontSize:17,lineHeight:1.8,color:'var(--muted)'}}>{p.description}</p><ProductVariantPicker product={p} variants={v}/><SocialShare title={p.name} path={`/shop/${p.slug}`}/><p className="muted" style={{marginTop:18}}>Need help? <a href="https://wa.me/2349168157255">Chat with us on WhatsApp</a>.</p></div></div><section style={{marginTop:54,borderTop:'1px solid var(--line)',paddingTop:34}}><div className="eyebrow">Verified customer feedback</div><h2>Product Reviews</h2>{reviews?.length?<div style={{display:'grid',gap:14,marginTop:20}}>{reviews.map((r:any)=><article key={r.id} style={{background:'#fff',border:'1px solid var(--line)',borderRadius:16,padding:20}}><div style={{color:'#c49324',fontSize:19}} aria-label={`${r.rating} out of 5 stars`}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>{r.title?<h3 style={{color:'var(--burgundy)',marginBottom:5}}>{r.title}</h3>:null}<p style={{lineHeight:1.7,whiteSpace:'pre-wrap'}}>{r.review}</p><p className="muted" style={{fontSize:13,marginBottom:0}}>{r.reviewer_name||'Verified customer'} · Verified purchase · {new Date(r.created_at).toLocaleDateString('en-NG')}</p></article>)}</div>:<div className="empty" style={{marginTop:20}}><h3>No approved reviews yet</h3><p>Customers who purchase this product can review it from the link in their thank-you email.</p></div>}</section></div></section></main>
}
