import Link from 'next/link'
import { createCatalogueClient } from '@/lib/supabase/server'
import CartLink from '@/components/cart-link'
import ProductCardActions from '@/components/product-card-actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Product = { id:string; name:string; slug:string; description:string|null; price:number; image_url:string|null; featured:boolean; stock_quantity:number; category_id:string|null; default_size_grams:number|null }
type Category = { id:string; name:string; slug:string }
type Variant = { id:string; product_id:string; size_grams:number; size_label:string; price:number; stock_quantity:number; is_active:boolean }
type Params = { category?:string; search?:string; sort?:string; min?:string; max?:string; stock?:string; size?:string; featured?:string }

export default async function ShopPage({searchParams}:{searchParams:Promise<Params>}) {
 const params=await searchParams; const supabase=await createCatalogueClient()
 const [{data:productsData},{data:categoriesData},{data:variantsData}]=await Promise.all([
  supabase.from('products').select('id,name,slug,description,price,image_url,featured,stock_quantity,category_id,default_size_grams').eq('is_active',true).order('created_at',{ascending:false}),
  supabase.from('categories').select('id,name,slug').order('name'),
  supabase.from('product_variants').select('id,product_id,size_grams,size_label,price,stock_quantity,is_active').eq('is_active',true).order('size_grams')])
 const products=(productsData??[]) as Product[], categories=(categoriesData??[]) as Category[], variants=(variantsData??[]) as Variant[]
 const selectedCategory=params.category?categories.find(c=>c.slug===params.category):null
 const byProduct=new Map<string,Variant[]>(); for(const v of variants){const a=byProduct.get(v.product_id)??[];a.push(v);byProduct.set(v.product_id,a)}
 const defaultVariant=new Map<string,Variant>(); for(const [id,list] of byProduct){defaultVariant.set(id,[...list].sort((a,b)=>Math.abs(a.size_grams-500)-Math.abs(b.size_grams-500))[0])}
 const min=params.min?Number(params.min):null,max=params.max?Number(params.max):null,q=params.search?.trim().toLowerCase()
 let filtered=products.filter(p=>{
  const pv=byProduct.get(p.id)??[], dv=defaultVariant.get(p.id), price=Number(dv?.price??p.price??0)
  if(selectedCategory&&p.category_id!==selectedCategory.id)return false
  if(q&&!`${p.name} ${p.description??''}`.toLowerCase().includes(q))return false
  if(params.featured==='1'&&!p.featured)return false
  if(params.stock==='in'&&!pv.some(v=>v.stock_quantity>0))return false
  if(params.size&&!pv.some(v=>v.size_label.toLowerCase()===params.size!.toLowerCase()))return false
  if(min!==null&&Number.isFinite(min)&&price<min)return false
  if(max!==null&&Number.isFinite(max)&&price>max)return false
  return true
 })
 const sort=params.sort??'featured'
 filtered.sort((a,b)=>{const av=Number(defaultVariant.get(a.id)?.price??a.price),bv=Number(defaultVariant.get(b.id)?.price??b.price);if(sort==='price-asc')return av-bv;if(sort==='price-desc')return bv-av;if(sort==='name')return a.name.localeCompare(b.name);return Number(b.featured)-Number(a.featured)})
 const sizes=[...new Set(variants.map(v=>v.size_label))]
 return <main><div className="topbar"><div className="container"><span>Better Ingredients. Better Processing. Better Experience.</span><span>Serving homes & businesses across Nigeria</span></div></div><header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium circular logo"/><span>FOLUS<br/>EMPORIUM<small>Curating Excellence for Life’s Finest Moments.</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><CartLink/><Link href="/account">My Account</Link></nav></div></header>
 <section className="shop-hero"><div className="container"><div className="eyebrow">The collection</div><h1 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(40px,6vw,62px)',color:'var(--burgundy)',margin:'12px 0'}}>Shop Folus Emporium</h1><p style={{color:'var(--muted)',maxWidth:680,fontSize:17,lineHeight:1.7}}>Find products by category, size, availability and price, then sort the collection to suit you.</p></div></section>
 <section className="section" style={{paddingTop:20}}><div className="container shop-layout"><aside className="filter"><form method="get"><h3>Filter products</h3><label>Search<input name="search" defaultValue={params.search??''} placeholder="Product name..."/></label><label>Category<select name="category" defaultValue={params.category??''}><option value="">All categories</option>{categories.map(c=><option key={c.id} value={c.slug}>{c.name}</option>)}</select></label><label>Package size<select name="size" defaultValue={params.size??''}><option value="">All sizes</option>{sizes.map(s=><option key={s}>{s}</option>)}</select></label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><label>Min ₦<input type="number" min="0" name="min" defaultValue={params.min??''}/></label><label>Max ₦<input type="number" min="0" name="max" defaultValue={params.max??''}/></label></div><label>Availability<select name="stock" defaultValue={params.stock??''}><option value="">All</option><option value="in">In stock</option></select></label><label>Collection<select name="featured" defaultValue={params.featured??''}><option value="">All products</option><option value="1">Featured only</option></select></label><label>Sort by<select name="sort" defaultValue={sort}><option value="featured">Featured first</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name A–Z</option></select></label><button className="btn btn-primary" style={{width:'100%'}} type="submit">Apply filters</button><Link className="btn btn-outline" style={{width:'100%',marginTop:8}} href="/shop">Clear filters</Link></form></aside>
 <div><div className="section-head" style={{marginBottom:24}}><div><div className="eyebrow">{q?`Search results for “${params.search?.trim()}”`:selectedCategory?.name??'All products'}</div><h2>{filtered.length} products</h2></div></div>{filtered.length?<div className="products">{filtered.map(p=>{const v=defaultVariant.get(p.id);return <article className="product-card" key={p.id}><Link href={`/shop/${p.slug}`}><div className="product-image">{p.image_url?<img src={p.image_url} alt={p.name}/>:<span>{p.name}</span>}</div></Link><div className="product-body"><span className="status">{p.featured?'Featured':'Folus collection'} · {v?.size_label??`${p.default_size_grams??500}g`}</span><h3><Link href={`/shop/${p.slug}`}>{p.name}</Link></h3><p>{p.description}</p><strong>{Number(v?.price??p.price)>0?`₦${Number(v?.price??p.price).toLocaleString('en-NG')}`:'Price to be updated'}</strong><ProductCardActions product={p} variant={v}/></div></article>})}</div>:<div className="empty"><h3>No products match these filters.</h3><p>Clear or adjust your filters to explore the collection.</p><Link className="btn btn-primary" href="/shop">Clear filters</Link></div>}</div></div></section></main>
}
