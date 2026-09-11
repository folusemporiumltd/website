import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import AdminBreadcrumbs from '@/components/admin-breadcrumbs'
import '../dashboard/dashboard.css'

async function requireAdmin(){
  const supabase=await createClient()
  const {data:auth}=await supabase.auth.getUser()
  if(!auth.user)redirect('/login?next=/admin/inventory&mode=signin')
  const {data:isAdmin,error}=await supabase.rpc('get_my_admin_status')
  if(error||isAdmin!==true)redirect('/account?admin_error=access')
  return {supabase,user:auth.user}
}

async function updateThreshold(formData:FormData){
  'use server'
  const {supabase}=await requireAdmin()
  const variantId=String(formData.get('variant_id')||'')
  const threshold=Number(formData.get('reorder_threshold'))
  if(!variantId||!Number.isInteger(threshold)||threshold<0)redirect('/admin/inventory?error=Invalid%20reorder%20threshold')
  const {error}=await supabase.rpc('admin_update_reorder_threshold',{p_variant_id:variantId,p_threshold:threshold})
  if(error)redirect(`/admin/inventory?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/inventory')
  revalidatePath('/admin/dashboard')
  redirect('/admin/inventory?saved=1')
}

export default async function InventoryPage({searchParams}:{searchParams:Promise<{saved?:string,error?:string}>}){
  const params=await searchParams
  const {supabase}=await requireAdmin()
  const [{data:variants,error:variantError},{data:products,error:productError}]=await Promise.all([
    supabase.rpc('list_admin_catalogue_variants'),
    supabase.rpc('list_admin_catalogue_products')
  ])
  const productMap=new Map((products??[]).map((p:any)=>[p.id,p]))
  const active=(variants??[]).filter((v:any)=>v.is_active)
  const alerts=active.filter((v:any)=>Number(v.stock_quantity)<=Number(v.reorder_threshold??5)).sort((a:any,b:any)=>Number(a.stock_quantity)-Number(b.stock_quantity))
  const outOfStock=active.filter((v:any)=>Number(v.stock_quantity)===0).length
  const healthy=active.length-alerts.length
  return <main className="admin-dashboard-shell">
    <div className="topbar"><div className="container"><span>Folus Emporium Administration</span><span>Inventory alerts</span></div></div>
    <header className="nav"><div className="container nav-inner"><Link className="brand" href="/admin/dashboard"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Inventory Manager</small></span></Link><nav className="navlinks"><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin/products">Products</Link><Link href="/admin/orders">Orders</Link><Link href="/account">Account</Link></nav></div></header>
    <section className="section" style={{paddingTop:42}}><div className="container">
      <AdminBreadcrumbs items={[{label:'Admin',href:'/admin/dashboard'},{label:'Inventory alerts'}]}/>
      <div className="section-head"><div><div className="eyebrow">Stock control</div><h1>Low-stock inventory alerts</h1><p className="muted" style={{maxWidth:760}}>Each active package size has its own reorder threshold. An alert appears when available stock is equal to or below that threshold.</p></div><Link className="btn btn-outline" href="/admin/products">Manage product stock</Link></div>
      <div className="admin-dashboard-stats" style={{marginTop:22}}><article className="admin-dashboard-stat"><span>Needs attention</span><strong>{alerts.length}</strong><p>Variants at or below threshold</p></article><article className="admin-dashboard-stat"><span>Out of stock</span><strong>{outOfStock}</strong><p>Active variants with zero units</p></article><article className="admin-dashboard-stat"><span>Healthy stock</span><strong>{healthy}</strong><p>Active variants above threshold</p></article></div>
      {params.saved?<p style={{padding:12,borderRadius:10,background:'#f2f8f2',marginTop:20}}>Reorder threshold updated successfully.</p>:null}
      {params.error?<p style={{padding:12,borderRadius:10,background:'#fff1f1',marginTop:20}}>Could not update threshold: {params.error}</p>:null}
      {(variantError||productError)?<p style={{padding:12,borderRadius:10,background:'#fff1f1',marginTop:20}}>Inventory data could not be loaded. Please refresh or sign in again.</p>:null}
      <section className="admin-dashboard-panel" style={{marginTop:28}}><div className="section-head" style={{marginBottom:18}}><div><div className="eyebrow">Priority restock list</div><h2>Items needing attention</h2></div></div>
        {alerts.length?<div className="admin-dashboard-table-wrap"><table className="admin-dashboard-table"><thead><tr><th>Product</th><th>Size</th><th>Stock</th><th>Reorder at</th><th>Status</th><th>Adjust threshold</th></tr></thead><tbody>{alerts.map((v:any)=>{const p:any=productMap.get(v.product_id);const stock=Number(v.stock_quantity);return <tr key={v.id}><td><strong>{p?.name||'Product'}</strong></td><td>{v.size_label}</td><td>{stock}</td><td>{v.reorder_threshold??5}</td><td><strong style={{color:'var(--burgundy)'}}>{stock===0?'OUT OF STOCK':'LOW STOCK'}</strong></td><td><form action={updateThreshold} style={{display:'flex',gap:8,alignItems:'center'}}><input type="hidden" name="variant_id" value={v.id}/><input name="reorder_threshold" type="number" min="0" defaultValue={v.reorder_threshold??5} style={{width:86}}/><button className="btn btn-outline" style={{padding:'8px 12px'}}>Save</button></form></td></tr>})}</tbody></table></div>:<div className="empty"><h3>Stock levels are healthy</h3><p>No active product variant is currently at or below its reorder threshold.</p></div>}
      </section>
      <section className="admin-dashboard-panel" style={{marginTop:24}}><div className="eyebrow">All active variants</div><h2>Reorder settings</h2><div className="admin-dashboard-table-wrap"><table className="admin-dashboard-table"><thead><tr><th>Product</th><th>Size</th><th>Current stock</th><th>Reorder threshold</th><th>Update</th></tr></thead><tbody>{active.map((v:any)=>{const p:any=productMap.get(v.product_id);return <tr key={v.id}><td>{p?.name||'Product'}</td><td>{v.size_label}</td><td>{v.stock_quantity}</td><td>{v.reorder_threshold??5}</td><td><form action={updateThreshold} style={{display:'flex',gap:8,alignItems:'center'}}><input type="hidden" name="variant_id" value={v.id}/><input name="reorder_threshold" type="number" min="0" defaultValue={v.reorder_threshold??5} style={{width:86}}/><button className="btn btn-outline" style={{padding:'8px 12px'}}>Save</button></form></td></tr>})}</tbody></table></div></section>
    </div></section>
  </main>
}
