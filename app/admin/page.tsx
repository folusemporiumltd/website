import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login?next=/admin')
  const { data: profile } = await supabase.from('profiles').select('full_name,role').eq('id', userId).single()
  if (profile?.role !== 'admin') redirect('/account')
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
  await supabase.from('products').update({
    name, description: description || null, price, stock_quantity: stock,
    default_size_grams: defaultSizeGrams, category_id: categoryId, image_url: imageUrl,
    featured: formData.get('featured') === 'on', is_active: formData.get('is_active') === 'on',
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  revalidatePath('/shop'); revalidatePath(`/shop/${slug}`); revalidatePath('/admin')
}

async function updateOrder(formData: FormData) {
  'use server'
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') || '')
  const status = String(formData.get('status') || '')
  const paymentStatus = String(formData.get('payment_status') || '')
  if (!id || !['pending','processing','shipped','delivered','cancelled'].includes(status) || !['pending','paid','failed','refunded'].includes(paymentStatus)) return
  await supabase.from('orders').update({ status, payment_status: paymentStatus, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/admin')
}

export default async function AdminPage() {
  const { supabase, profile } = await requireAdmin()
  const [{ data: products }, { data: orders }, { data: categories }] = await Promise.all([
    supabase.from('products').select('id,name,slug,description,price,image_url,stock_quantity,featured,is_active,category_id,default_size_grams').order('created_at', { ascending: false }),
    supabase.from('orders').select('id,status,payment_status,total,phone,delivery_address,created_at').order('created_at', { ascending: false }).limit(50),
    supabase.from('categories').select('id,name,slug').order('name'),
  ])

  return <main>
    <div className="topbar"><div className="container"><span>Folus Emporium Admin</span><span>Catalogue & orders</span></div></div>
    <header className="nav"><div className="container nav-inner"><a className="brand" href="/"><img src="/brand/folus-emporium-logo.jpg" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Admin</small></span></a><nav className="navlinks"><a href="/">Storefront</a><a href="/shop">Shop</a><a href="/account">My Account</a></nav></div></header>
    <section className="section"><div className="container">
      <div className="section-head"><div><div className="eyebrow">Dashboard</div><h1>Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}</h1><p style={{color:'var(--muted)'}}>Edit products and manage recent customer orders.</p></div></div>
      <h2 style={{color:'var(--burgundy)',marginTop:35}}>Product catalogue</h2>
      <p style={{color:'var(--muted)',marginTop:6}}>Each product starts with a 500g default size. You can change the size, price, image, description, stock, category and featured/visibility settings here.</p>
      <div style={{display:'grid',gap:18,marginTop:18}}>{products?.map(product => <form key={product.id} action={updateProduct} style={{border:'1px solid #eadfd8',borderRadius:16,padding:20,background:'#fff'}}>
        <input type="hidden" name="id" value={product.id}/><input type="hidden" name="slug" value={product.slug}/>
        <div style={{display:'grid',gridTemplateColumns:'minmax(0,2fr) minmax(120px,1fr) minmax(120px,1fr) minmax(120px,1fr)',gap:14,alignItems:'end'}}>
          <label>Name<input name="name" defaultValue={product.name} required style={{width:'100%'}}/></label>
          <label>Price (₦)<input name="price" type="number" min="0" step="100" defaultValue={product.price} required style={{width:'100%'}}/></label>
          <label>Stock<input name="stock_quantity" type="number" min="0" step="1" defaultValue={product.stock_quantity} required style={{width:'100%'}}/></label>
          <label>Default size (g)<input name="default_size_grams" type="number" min="1" step="1" defaultValue={product.default_size_grams ?? 500} required style={{width:'100%'}}/></label>
          <label>Category<select name="category_id" defaultValue={product.category_id ?? ''} style={{width:'100%'}}><option value="">Uncategorised</option>{categories?.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label style={{gridColumn:'2 / -1'}}>Image URL<input name="image_url" type="url" defaultValue={product.image_url ?? ''} placeholder="https://..." style={{width:'100%'}}/></label>
          <label style={{gridColumn:'1 / -1'}}>Description<textarea name="description" defaultValue={product.description ?? ''} rows={2} style={{width:'100%'}}/></label>
        </div>
        <div style={{display:'flex',gap:20,flexWrap:'wrap',alignItems:'center',marginTop:14}}><label><input type="checkbox" name="featured" defaultChecked={product.featured}/> Featured</label><label><input type="checkbox" name="is_active" defaultChecked={product.is_active}/> Visible in shop</label><button className="btn btn-primary" type="submit">Save product</button></div>
      </form>)}</div>
      <h2 style={{color:'var(--burgundy)',marginTop:55}}>Recent orders</h2>
      <div style={{display:'grid',gap:14,marginTop:18}}>{orders?.length ? orders.map(order => <form key={order.id} action={updateOrder} style={{border:'1px solid #eadfd8',borderRadius:16,padding:18,background:'#fff'}}>
        <input type="hidden" name="id" value={order.id}/><div style={{display:'flex',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}><div><strong>Order #{order.id.slice(0,8)}</strong><div style={{color:'var(--muted)',fontSize:14}}>{new Date(order.created_at).toLocaleString('en-NG')} · {order.phone || 'No phone'}</div><div style={{marginTop:6}}>Total: <strong>₦{Number(order.total).toLocaleString('en-NG')}</strong></div></div><div style={{display:'flex',gap:10,alignItems:'end',flexWrap:'wrap'}}><label>Status<select name="status" defaultValue={order.status}><option value="pending">Pending</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></label><label>Payment<select name="payment_status" defaultValue={order.payment_status}><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></label><button className="btn btn-outline" type="submit">Update</button></div></div>{order.delivery_address ? <p style={{marginBottom:0,color:'var(--muted)'}}>Delivery: {order.delivery_address}</p> : null}
      </form>) : <p style={{color:'var(--muted)'}}>No orders yet.</p>}</div>
    </div></section>
  </main>
}
