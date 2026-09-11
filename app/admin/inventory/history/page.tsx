import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminBreadcrumbs from '@/components/admin-breadcrumbs'
import '../../dashboard/dashboard.css'

async function requireAdmin(){
  const supabase=await createClient()
  const {data:auth}=await supabase.auth.getUser()
  if(!auth.user)redirect('/login?next=/admin/inventory/history&mode=signin')
  const {data:isAdmin,error}=await supabase.rpc('get_my_admin_status')
  if(error||isAdmin!==true)redirect('/account?admin_error=access')
  return {supabase,user:auth.user}
}

function changeLabel(value:number){
  if(value>0)return `+${value}`
  return String(value)
}

export default async function StockMovementHistoryPage(){
  const {supabase}=await requireAdmin()
  const {data:movements,error}=await supabase.rpc('list_admin_stock_movements',{p_limit:200})
  const rows=movements??[]
  return <main className="admin-dashboard-shell">
    <div className="topbar"><div className="container"><span>Folus Emporium Administration</span><span>Stock movement history</span></div></div>
    <header className="nav"><div className="container nav-inner"><Link className="brand" href="/admin/dashboard"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Inventory History</small></span></Link><nav className="navlinks"><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin/inventory">Inventory</Link><Link href="/admin/products">Products</Link><Link href="/admin/orders">Orders</Link><Link href="/account">Account</Link></nav></div></header>
    <section className="section" style={{paddingTop:42}}><div className="container">
      <AdminBreadcrumbs items={[{label:'Admin',href:'/admin/dashboard'},{label:'Inventory',href:'/admin/inventory'},{label:'Stock movement history'}]}/>
      <div className="section-head"><div><div className="eyebrow">Inventory audit trail</div><h1>Stock movement history</h1><p className="muted" style={{maxWidth:760}}>Every change to a product variant's stock quantity is recorded automatically, including single updates, bulk restocking and other stock adjustments.</p></div><Link className="btn btn-outline" href="/admin/inventory">Back to inventory</Link></div>
      {error?<p style={{padding:12,borderRadius:10,background:'#fff1f1',marginTop:20}}>Stock history could not be loaded. Please refresh or sign in again.</p>:null}
      <section className="admin-dashboard-panel" style={{marginTop:28}}><div className="section-head" style={{marginBottom:18}}><div><div className="eyebrow">Recent activity</div><h2>Latest stock changes</h2><p className="muted" style={{marginBottom:0}}>Showing up to the 200 most recent stock quantity changes.</p></div></div>
        {rows.length?<div className="admin-dashboard-table-wrap"><table className="admin-dashboard-table"><thead><tr><th>Date</th><th>Product</th><th>Size</th><th>Previous</th><th>New</th><th>Change</th><th>Changed by</th></tr></thead><tbody>{rows.map((m:any)=><tr key={m.id}><td>{new Date(m.created_at).toLocaleString('en-NG')}</td><td><strong>{m.product_name}</strong></td><td>{m.size_label}</td><td>{m.old_quantity}</td><td>{m.new_quantity}</td><td><strong style={{color:Number(m.quantity_change)<0?'var(--burgundy)':'inherit'}}>{changeLabel(Number(m.quantity_change))}</strong></td><td>{m.changed_by_name||'System / checkout'}</td></tr>)}</tbody></table></div>:<div className="empty"><h3>No stock movements recorded yet</h3><p>New stock changes will begin appearing here automatically.</p></div>}
      </section>
    </div></section>
  </main>
}
