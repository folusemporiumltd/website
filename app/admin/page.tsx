import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import AdminProductImageUploader from '@/components/admin-product-image-uploader'
import AdminBreadcrumbs from '@/components/admin-breadcrumbs'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id
  if (!userId) redirect('/login?next=/admin&mode=signin')
  const { data: isAdmin, error: adminError } = await supabase.rpc('get_my_admin_status')
  if (adminError || isAdmin !== true) redirect('/account?admin_error=access')
  const { data: profile } = await supabase.from('profiles').select('full_name,role').eq('id', userId).maybeSingle()
  return { supabase, profile }
}

async function updateProduct(formData: FormData) {
  'use server'
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') || '')
  const slug = String(formData.get('slug') || '')
  const name = String(formData.get('name') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const price = Number(formData.get('price'))
  const stock = Number(formData.get('stock_quantity'))
  const defaultSizeGrams = Number(formData.get('default_size_grams'))
  const categoryId = String(formData.get('category_id') || '') || null
  const imageUrl = String(formData.get('image_url') || '').trim() || null
  if (!id || !name || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0 || !Number.isInteger(defaultSizeGrams) || defaultSizeGrams <= 0) return
  await supabase.from('products').update({ name, description: description || null, price, stock_quantity: stock, default_size_grams: defaultSizeGrams, category_id: categoryId, image_url: imageUrl, featured: formData.get('featured') === 'on', is_active: formData.get('is_active') === 'on', updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/shop'); revalidatePath(`/shop/${slug}`); revalidatePath('/admin')
}

async function updateVariant(formData: FormData) {
  'use server'
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') || '')
  const productId = String(formData.get('product_id') || '')
  const price = Number(formData.get('price'))
  const stock = Number(formData.get('stock_quantity'))
  const sizeGrams = Number(formData.get('size_grams'))
  const sizeLabel = String(formData.get('size_label') || '').trim()
  if (!id || !productId || !sizeLabel || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0 || !Number.isInteger(sizeGrams) || sizeGrams <= 0) return
  await supabase.from('product_variants').update({ size_grams: sizeGrams, size_label: sizeLabel, price, stock_quantity: stock, is_active: formData.get('is_active') === 'on', updated_at: new Date().toISOString() }).eq('id', id).eq('product_id', productId)
  revalidatePath('/shop'); revalidatePath('/admin')
}

async function updateStorefrontContent(formData: FormData) {
  'use server'
  const { supabase } = await requireAdmin()
  const { data: row } = await supabase.from('storefront_content').select('config').eq('id', true).maybeSingle()
  const existing = row?.config && typeof row.config === 'object' && !Array.isArray(row.config) ? row.config as Record<string, unknown> : {}
  const existingSocial = existing.social && typeof existing.social === 'object' && !Array.isArray(existing.social) ? existing.social as Record<string, unknown> : {}

  const utilityLinks = [0,1,2].map(i => [String(formData.get(`utility_label_${i}`) || '').trim(), String(formData.get(`utility_url_${i}`) || '').trim()]).filter(([label,url]) => label && url)
  const navigation = [0,1,2,3,4,5,6,7].map(i => [String(formData.get(`nav_label_${i}`) || '').trim(), String(formData.get(`nav_url_${i}`) || '').trim()]).filter(([label,url]) => label && url)
  const config = {
    ...existing,
    announcement: String(formData.get('announcement') || '').trim(),
    utilityLinks,
    navigation,
    social: {
      ...existingSocial,
      facebook: String(formData.get('facebook') || '').trim(),
      instagram: String(formData.get('instagram') || '').trim(),
      tiktok: String(formData.get('tiktok') || '').trim(),
      whatsapp: String(formData.get('whatsapp') || '').trim(),
    },
  }
  await supabase.from('storefront_content').update({ config, updated_at: new Date().toISOString() }).eq('id', true)
  revalidatePath('/'); revalidatePath('/admin')
}

async function updateOrder(formData: FormData) {
  'use server'
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') || '')
  const status = String(formData.get('status') || '')
  const paymentStatus = String(formData.get('payment_status') || '')
  if (!id || !['pending','processing','shipped','delivered','cancelled'].includes(status) || !['pending','paid','failed','refunded'].includes(paymentStatus)) return
  await supabase.from('orders').update({ status, payment_status: paymentStatus, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/admin'); revalidatePath('/admin/dashboard')
}

export default async function AdminPage() {
  const { supabase, profile } = await requireAdmin()
  const [{ data: products }, { data: orders }, { data: categories }, { data: variants }, { data: storefront }] = await Promise.all([
    supabase.from('products').select('id,name,slug,description,price,image_url,stock_quantity,featured,is_active,category_id,default_size_grams').order('created_at', { ascending: false }),
    supabase.from('orders').select('id,status,payment_status,total,phone,delivery_address,created_at').order('created_at', { ascending: false }).limit(50),
    supabase.from('categories').select('id,name,slug').order('name'),
    supabase.from('product_variants').select('id,product_id,size_grams,size_label,price,stock_quantity,is_active').order('size_grams'),
    supabase.from('storefront_content').select('config').eq('id', true).maybeSingle(),
  ])
  const variantsByProduct = new Map<string, typeof variants>()
  for (const variant of variants ?? []) { const list = variantsByProduct.get(variant.product_id) ?? []; list.push(variant); variantsByProduct.set(variant.product_id, list) }

  const rawConfig = storefront?.config && typeof storefront.config === 'object' && !Array.isArray(storefront.config) ? storefront.config as Record<string, unknown> : {}
  const announcement = typeof rawConfig.announcement === 'string' ? rawConfig.announcement : 'Serving homes & businesses across Nigeria.'
  const social = rawConfig.social && typeof rawConfig.social === 'object' && !Array.isArray(rawConfig.social) ? rawConfig.social as Record<string, unknown> : {}
  const utilityLinks = Array.isArray(rawConfig.utilityLinks) ? rawConfig.utilityLinks as string[][] : [['Track Order','/account'],['FAQ','/faq'],['Contact Us','/contact']]
  const navigation = Array.isArray(rawConfig.navigation) ? rawConfig.navigation as string[][] : [['Home','/'],['Shop','/shop'],['Categories','/shop'],['About Us','/about'],['Our Story','/about#story'],['Blog','/blog'],['Careers','/careers'],['Contact Us','/contact']]

  return <main>
    <div className="topbar"><div className="container"><span>Folus Emporium Admin</span><span>Catalogue & orders</span></div></div>
    <header className="nav"><div className="container nav-inner"><a className="brand" href="/admin/dashboard"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Admin</small></span></a><nav className="navlinks"><a href="/admin/dashboard">Dashboard</a><a href="/admin/coupons">Coupons</a><a href="/admin/users">Roles</a><a href="/">Storefront</a><a href="/account">Account</a></nav></div></header>
    <section className="section"><div className="container">
      <AdminBreadcrumbs items={[{label:'Admin',href:'/admin/dashboard'},{label:'Store Manager'}]}/>
      <div className="section-head"><div><div className="eyebrow">Store Manager</div><h1>Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}</h1><p style={{color:'var(--muted)'}}>Manage product information, package sizes, inventory, storefront content and recent orders.</p></div></div>

      <section style={{border:'1px solid #eadfd8',borderRadius:16,padding:20,background:'#fff',marginTop:28}}>
        <h2 style={{color:'var(--burgundy)',marginTop:0}}>Storefront Settings</h2>
        <p style={{color:'var(--muted)',marginTop:6}}>Update the customer-facing header and navigation using normal form fields. No code editing is required.</p>
        <form action={updateStorefrontContent} style={{display:'grid',gap:24}}>
          <div style={{display:'grid',gap:10}}><h3 style={{margin:0,color:'var(--burgundy)'}}>Announcement bar</h3><label>Announcement text<input name="announcement" defaultValue={announcement}/></label></div>
          <div style={{display:'grid',gap:12}}><h3 style={{margin:0,color:'var(--burgundy)'}}>Social media links</h3><div className="admin-form-grid" style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:12}}><label>Facebook URL<input name="facebook" type="url" defaultValue={typeof social.facebook==='string'?social.facebook:''}/></label><label>Instagram URL<input name="instagram" type="url" defaultValue={typeof social.instagram==='string'?social.instagram:''}/></label><label>TikTok URL<input name="tiktok" type="url" defaultValue={typeof social.tiktok==='string'?social.tiktok:''}/></label><label>WhatsApp URL<input name="whatsapp" type="url" defaultValue={typeof social.whatsapp==='string'?social.whatsapp:''}/></label></div></div>
          <div style={{display:'grid',gap:12}}><h3 style={{margin:0,color:'var(--burgundy)'}}>Top utility links</h3>{[0,1,2].map(i => <div key={`utility-${i}`} style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:12}}><label>Link name<input name={`utility_label_${i}`} defaultValue={utilityLinks[i]?.[0] ?? ''}/></label><label>Link destination<input name={`utility_url_${i}`} defaultValue={utilityLinks[i]?.[1] ?? ''} placeholder="/contact or https://..."/></label></div>)}</div>
          <div style={{display:'grid',gap:12}}><h3 style={{margin:0,color:'var(--burgundy)'}}>Main navigation menu</h3><p className="muted" style={{margin:0}}>Edit the name shown to customers and where each menu item should open.</p>{[0,1,2,3,4,5,6,7].map(i => <div key={`nav-${i}`} style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:12}}><label>Menu name<input name={`nav_label_${i}`} defaultValue={navigation[i]?.[0] ?? ''}/></label><label>Destination<input name={`nav_url_${i}`} defaultValue={navigation[i]?.[1] ?? ''} placeholder="/shop or https://..."/></label></div>)}</div>
          <div><button className="btn btn-primary" type="submit">Save storefront settings</button></div>
        </form>
      </section>

      <h2 style={{color:'var(--burgundy)',marginTop:35}}>Product catalogue</h2><p style={{color:'var(--muted)',marginTop:6}}>Upload the exact product flyer, edit descriptions, set prices and manage stock without rebuilding the website.</p>
      <div style={{display:'grid',gap:18,marginTop:18}}>{products?.map(product => <div key={product.id} style={{border:'1px solid #eadfd8',borderRadius:16,padding:20,background:'#fff'}}><div className="admin-product-header"><AdminProductImageUploader productId={product.id} productName={product.name} currentUrl={product.image_url}/><form action={updateProduct} className="admin-product-form"><input type="hidden" name="id" value={product.id}/><input type="hidden" name="slug" value={product.slug}/><div className="admin-form-grid" style={{display:'grid',gridTemplateColumns:'minmax(0,2fr) minmax(120px,1fr) minmax(120px,1fr) minmax(120px,1fr)',gap:14,alignItems:'end'}}><label>Name<input name="name" defaultValue={product.name} required/></label><label>Base price (₦)<input name="price" type="number" min="0" step="100" defaultValue={product.price} required/></label><label>Base stock<input name="stock_quantity" type="number" min="0" step="1" defaultValue={product.stock_quantity} required/></label><label>Default size (g)<input name="default_size_grams" type="number" min="1" step="1" defaultValue={product.default_size_grams ?? 500} required/></label><label>Category<select name="category_id" defaultValue={product.category_id ?? ''}><option value="">Uncategorised</option>{categories?.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label style={{gridColumn:'2 / -1'}}>Image URL<input name="image_url" type="url" defaultValue={product.image_url ?? ''} placeholder="Optional external image URL"/></label><label style={{gridColumn:'1 / -1'}}>Description<textarea name="description" defaultValue={product.description ?? ''} rows={2}/></label></div><div style={{display:'flex',gap:20,flexWrap:'wrap',alignItems:'center',marginTop:14}}><label><input type="checkbox" name="featured" defaultChecked={product.featured}/> Featured</label><label><input type="checkbox" name="is_active" defaultChecked={product.is_active}/> Visible in shop</label><button className="btn btn-primary" type="submit">Save product</button></div></form></div><div style={{marginTop:24,paddingTop:20,borderTop:'1px solid #eadfd8'}}><h3 style={{color:'var(--burgundy)',margin:'0 0 8px'}}>Package sizes & inventory</h3><p className="muted" style={{marginTop:0}}>Edit package sizes, prices and stock independently.</p><div style={{display:'grid',gap:10}}>{(variantsByProduct.get(product.id) ?? []).map(variant => <form className="admin-variant-row" key={variant.id} action={updateVariant} style={{display:'grid',gridTemplateColumns:'110px 1fr 130px 130px auto',gap:10,alignItems:'end',padding:12,border:'1px solid #f0e5de',borderRadius:12,background:'#fcfaf7'}}><input type="hidden" name="id" value={variant.id}/><input type="hidden" name="product_id" value={product.id}/><label>Label<input name="size_label" defaultValue={variant.size_label}/></label><label>Grams<input name="size_grams" type="number" min="1" defaultValue={variant.size_grams}/></label><label>Price ₦<input name="price" type="number" min="0" step="100" defaultValue={variant.price}/></label><label>Stock<input name="stock_quantity" type="number" min="0" defaultValue={variant.stock_quantity}/></label><div><label><input type="checkbox" name="is_active" defaultChecked={variant.is_active}/> Active</label><button className="btn btn-outline" type="submit" style={{padding:'9px 14px',fontSize:12}}>Save size</button></div></form>)}</div></div></div>)}</div>
      <h2 style={{color:'var(--burgundy)',marginTop:55}}>Recent orders</h2><div style={{display:'grid',gap:14,marginTop:18}}>{orders?.length ? orders.map(order => <form key={order.id} action={updateOrder} style={{border:'1px solid #eadfd8',borderRadius:16,padding:18,background:'#fff'}}><input type="hidden" name="id" value={order.id}/><div style={{display:'flex',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}><div><strong>Order #{order.id.slice(0,8)}</strong><div style={{color:'var(--muted)',fontSize:14}}>{new Date(order.created_at).toLocaleString('en-NG')} · {order.phone || 'No phone'}</div><div style={{marginTop:6}}>Total: <strong>₦{Number(order.total).toLocaleString('en-NG')}</strong></div></div><div style={{display:'flex',gap:10,alignItems:'end',flexWrap:'wrap'}}><label>Status<select name="status" defaultValue={order.status}><option value="pending">Pending</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></label><label>Payment<select name="payment_status" defaultValue={order.payment_status}><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></label><button className="btn btn-outline" type="submit">Update</button></div></div>{order.delivery_address ? <p style={{marginBottom:0,color:'var(--muted)'}}>Delivery: {order.delivery_address}</p> : null}</form>) : <p style={{color:'var(--muted)'}}>No orders yet.</p>}</div>
    </div></section>
  </main>
}
