import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import AdminProductImageUploader from '@/components/admin-product-image-uploader'
import AdminBreadcrumbs from '@/components/admin-breadcrumbs'

async function requireAdmin(){
  const s=await createClient()
  const {data:a}=await s.auth.getUser()
  if(!a.user)redirect('/login?next=/admin/products&mode=signin')
  const {data:isAdmin,error}=await s.rpc('get_my_admin_status')
  if(error||isAdmin!==true)redirect('/account?admin_error=access')
  return {s,user:a.user}
}

function slugify(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'product'}
async function uniqueSlug(s:any,name:string){const base=slugify(name);let slug=base,i=2;while(true){const {data}=await s.from('products').select('id').eq('slug',slug).maybeSingle();if(!data)return slug;slug=`${base}-${i++}`}}
function refresh(slug?:string){revalidatePath('/');revalidatePath('/shop');revalidatePath('/admin');revalidatePath('/admin/products');revalidatePath('/admin/dashboard');if(slug)revalidatePath(`/shop/${slug}`)}

async function createProduct(formData:FormData){
  'use server'
  const {s}=await requireAdmin()
  const name=String(formData.get('name')||'').trim(),description=String(formData.get('description')||'').trim()
  const price=Number(formData.get('price')||0),stock=Number(formData.get('stock_quantity')||0),defaultSize=Number(formData.get('default_size_grams')||500)
  const categoryId=String(formData.get('category_id')||'')||null
  if(!name||!Number.isFinite(price)||price<0||!Number.isInteger(stock)||stock<0||!Number.isInteger(defaultSize)||defaultSize<=0)return
  const slug=await uniqueSlug(s,name)
  const {error}=await s.from('products').insert({name,slug,description:description||null,price,stock_quantity:stock,default_size_grams:defaultSize,category_id:categoryId,featured:formData.get('featured')==='on',is_active:formData.get('is_active')==='on'})
  if(error)redirect(`/admin/products?error=${encodeURIComponent(error.message)}`)
  refresh(slug);redirect('/admin/products?created=1')
}

async function updateProduct(formData:FormData){
  'use server'
  const {s}=await requireAdmin()
  const id=String(formData.get('id')||''),slug=String(formData.get('slug')||''),name=String(formData.get('name')||'').trim(),description=String(formData.get('description')||'').trim()
  const price=Number(formData.get('price')),stock=Number(formData.get('stock_quantity')),defaultSize=Number(formData.get('default_size_grams'))
  const categoryId=String(formData.get('category_id')||'')||null,imageUrl=String(formData.get('image_url')||'').trim()||null
  if(!id||!name||!Number.isFinite(price)||price<0||!Number.isInteger(stock)||stock<0||!Number.isInteger(defaultSize)||defaultSize<=0)return
  const {error}=await s.from('products').update({name,description:description||null,price,stock_quantity:stock,default_size_grams:defaultSize,category_id:categoryId,image_url:imageUrl,featured:formData.get('featured')==='on',is_active:formData.get('is_active')==='on',updated_at:new Date().toISOString()}).eq('id',id)
  if(error)redirect(`/admin/products?error=${encodeURIComponent(error.message)}`)
  refresh(slug);redirect('/admin/products?updated=1')
}

async function addVariant(formData:FormData){
  'use server'
  const {s}=await requireAdmin()
  const productId=String(formData.get('product_id')||''),label=String(formData.get('size_label')||'').trim(),grams=Number(formData.get('size_grams')),price=Number(formData.get('price')),stock=Number(formData.get('stock_quantity')||0)
  if(!productId||!label||!Number.isInteger(grams)||grams<=0||!Number.isFinite(price)||price<0||!Number.isInteger(stock)||stock<0)return
  const {error}=await s.from('product_variants').insert({product_id:productId,size_label:label,size_grams:grams,price,stock_quantity:stock,is_active:true})
  if(error)redirect(`/admin/products?error=${encodeURIComponent(error.message)}`)
  refresh();redirect('/admin/products?variant=created')
}

async function updateVariant(formData:FormData){
  'use server'
  const {s}=await requireAdmin()
  const id=String(formData.get('id')||''),productId=String(formData.get('product_id')||''),label=String(formData.get('size_label')||'').trim(),grams=Number(formData.get('size_grams')),price=Number(formData.get('price')),stock=Number(formData.get('stock_quantity'))
  if(!id||!productId||!label||!Number.isInteger(grams)||grams<=0||!Number.isFinite(price)||price<0||!Number.isInteger(stock)||stock<0)return
  const {error}=await s.from('product_variants').update({size_label:label,size_grams:grams,price,stock_quantity:stock,is_active:formData.get('is_active')==='on',updated_at:new Date().toISOString()}).eq('id',id).eq('product_id',productId)
  if(error)redirect(`/admin/products?error=${encodeURIComponent(error.message)}`)
  refresh();redirect('/admin/products?variant=updated')
}

export default async function ProductCatalogue({searchParams}:{searchParams:Promise<{created?:string,updated?:string,variant?:string,error?:string}>}){
  const params=await searchParams
  const {s}=await requireAdmin()
  const [{data:products},{data:categories},{data:variants}]=await Promise.all([
    s.from('products').select('id,name,slug,description,price,image_url,stock_quantity,featured,is_active,category_id,default_size_grams,created_at').order('created_at',{ascending:false}),
    s.from('categories').select('id,name,slug').order('name'),
    s.from('product_variants').select('id,product_id,size_grams,size_label,price,stock_quantity,is_active').order('size_grams')
  ])
  const variantsByProduct=new Map<string,any[]>();for(const v of variants??[]){const a=variantsByProduct.get(v.product_id)??[];a.push(v);variantsByProduct.set(v.product_id,a)}
  const active=products?.filter(p=>p.is_active).length??0,featured=products?.filter(p=>p.featured).length??0,totalStock=(variants??[]).reduce((n,v)=>n+Number(v.stock_quantity||0),0)
  return <main><div className="topbar"><div className="container"><span>Folus Emporium Administration</span><span>Product catalogue</span></div></div><header className="nav"><div className="container nav-inner"><Link className="brand" href="/admin/dashboard"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Product Manager</small></span></Link><nav className="navlinks"><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin">Store Manager</Link><Link href="/admin/coupons">Coupons</Link><Link href="/admin/users">Roles</Link><Link href="/">Storefront</Link></nav></div></header><section className="section"><div className="container" style={{maxWidth:1180}}><AdminBreadcrumbs items={[{label:'Admin',href:'/admin/dashboard'},{label:'Product Catalogue'}]}/><div className="section-head"><div><div className="eyebrow">Catalogue management</div><h1>Products & inventory</h1><p className="muted">Create new products, upload or replace flyers, edit descriptions, pricing, categories, stock, package sizes, visibility and featured status without rebuilding the website.</p></div><Link className="btn btn-outline" href="/shop">View live shop</Link></div>
  <div style={{display:'flex',gap:12,flexWrap:'wrap',margin:'20px 0 28px'}}><div className="admin-dashboard-stat"><span>Products</span><strong>{products?.length??0}</strong><p>{active} visible in shop</p></div><div className="admin-dashboard-stat"><span>Featured</span><strong>{featured}</strong><p>Homepage featured products</p></div><div className="admin-dashboard-stat"><span>Variant stock</span><strong>{totalStock}</strong><p>Total stock across package sizes</p></div></div>
  {(params.created||params.updated||params.variant)?<p style={{padding:12,borderRadius:10,background:'#f2f8f2'}}>Catalogue saved successfully.</p>:null}{params.error?<p style={{padding:12,borderRadius:10,background:'#fff1f1'}}>Could not save: {params.error}</p>:null}
  <section style={{border:'1px solid var(--line)',borderRadius:18,padding:20,background:'#fff',margin:'26px 0'}}><h2 style={{marginTop:0,color:'var(--burgundy)'}}>Add new product</h2><p className="muted">Create the product first, then upload its flyer from the product card below.</p><form action={createProduct} style={{display:'grid',gap:14}}><div className="admin-form-grid" style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:12}}><label>Product name<input name="name" required/></label><label>Base price (₦)<input name="price" type="number" min="0" step="50" required/></label><label>Base stock<input name="stock_quantity" type="number" min="0" defaultValue="0" required/></label><label>Default size (g)<input name="default_size_grams" type="number" min="1" defaultValue="500" required/></label><label>Category<select name="category_id" defaultValue=""><option value="">Uncategorised</option>{categories?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label style={{gridColumn:'2 / -1'}}>Description<textarea name="description" rows={2}/></label></div><div style={{display:'flex',gap:18,alignItems:'center',flexWrap:'wrap'}}><label><input type="checkbox" name="featured"/> Featured</label><label><input type="checkbox" name="is_active" defaultChecked/> Visible in shop</label><button className="btn btn-primary">Create product</button></div></form></section>
  <div style={{display:'grid',gap:20}}>{products?.map(product=><article key={product.id} style={{border:'1px solid var(--line)',borderRadius:18,padding:20,background:'#fff'}}><div style={{display:'flex',justifyContent:'space-between',gap:16,flexWrap:'wrap',marginBottom:16}}><div><div className="eyebrow">{product.is_active?'Visible':'Hidden'}{product.featured?' · Featured':''}</div><h2 style={{margin:'4px 0',color:'var(--burgundy)'}}>{product.name}</h2><Link href={`/shop/${product.slug}`} target="_blank" className="muted">Open product page ↗</Link></div></div><div className="admin-product-header"><AdminProductImageUploader productId={product.id} productName={product.name} currentUrl={product.image_url}/><form action={updateProduct} className="admin-product-form"><input type="hidden" name="id" value={product.id}/><input type="hidden" name="slug" value={product.slug}/><div className="admin-form-grid" style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:12,alignItems:'end'}}><label>Name<input name="name" defaultValue={product.name} required/></label><label>Base price (₦)<input name="price" type="number" min="0" step="50" defaultValue={product.price} required/></label><label>Base stock<input name="stock_quantity" type="number" min="0" defaultValue={product.stock_quantity} required/></label><label>Default size (g)<input name="default_size_grams" type="number" min="1" defaultValue={product.default_size_grams??500} required/></label><label>Category<select name="category_id" defaultValue={product.category_id??''}><option value="">Uncategorised</option>{categories?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label style={{gridColumn:'2 / -1'}}>External image URL (optional)<input name="image_url" type="url" defaultValue={product.image_url??''}/></label><label style={{gridColumn:'1 / -1'}}>Description<textarea name="description" rows={3} defaultValue={product.description??''}/></label></div><div style={{display:'flex',gap:18,alignItems:'center',flexWrap:'wrap',marginTop:12}}><label><input type="checkbox" name="featured" defaultChecked={product.featured}/> Featured</label><label><input type="checkbox" name="is_active" defaultChecked={product.is_active}/> Visible in shop</label><button className="btn btn-primary">Save product</button></div></form></div>
  <section style={{marginTop:22,paddingTop:18,borderTop:'1px solid var(--line)'}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><div><h3 style={{margin:'0 0 4px',color:'var(--burgundy)'}}>Package sizes & stock</h3><p className="muted" style={{margin:0}}>Each size can have its own price, stock quantity and active status.</p></div></div><div style={{display:'grid',gap:10,marginTop:14}}>{(variantsByProduct.get(product.id)??[]).map(v=><form key={v.id} action={updateVariant} className="admin-variant-row" style={{display:'grid',gridTemplateColumns:'120px 1fr 140px 120px auto',gap:10,alignItems:'end',padding:12,border:'1px solid #f0e5de',borderRadius:12,background:'#fcfaf7'}}><input type="hidden" name="id" value={v.id}/><input type="hidden" name="product_id" value={product.id}/><label>Size label<input name="size_label" defaultValue={v.size_label}/></label><label>Grams<input name="size_grams" type="number" min="1" defaultValue={v.size_grams}/></label><label>Price (₦)<input name="price" type="number" min="0" step="50" defaultValue={v.price}/></label><label>Stock<input name="stock_quantity" type="number" min="0" defaultValue={v.stock_quantity}/></label><div><label><input name="is_active" type="checkbox" defaultChecked={v.is_active}/> Active</label><button className="btn btn-outline" style={{marginTop:6}}>Save size</button></div></form>)}</div><form action={addVariant} style={{display:'grid',gridTemplateColumns:'120px 1fr 140px 120px auto',gap:10,alignItems:'end',marginTop:12,padding:12,border:'1px dashed var(--line)',borderRadius:12}}><input type="hidden" name="product_id" value={product.id}/><label>New size<input name="size_label" placeholder="e.g. 500g" required/></label><label>Grams<input name="size_grams" type="number" min="1" required/></label><label>Price (₦)<input name="price" type="number" min="0" step="50" required/></label><label>Stock<input name="stock_quantity" type="number" min="0" defaultValue="0" required/></label><button className="btn btn-outline">Add size</button></form></section></article>)}</div></div></section></main>
}
