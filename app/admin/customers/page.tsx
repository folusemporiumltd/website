import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminBreadcrumbs from '@/components/admin-breadcrumbs'
import '../dashboard/dashboard.css'

async function requireAdmin(){
  const supabase=await createClient()
  const {data:auth}=await supabase.auth.getUser()
  if(!auth.user)redirect('/login?next=/admin/customers&mode=signin')
  const {data:isAdmin,error}=await supabase.rpc('get_my_admin_status')
  if(error||isAdmin!==true)redirect('/account?admin_error=access')
  return supabase
}

function money(v:any){return new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(Number(v||0))}
function niceDate(v:any){return v?new Date(v).toLocaleString('en-NG',{dateStyle:'medium',timeStyle:'short'}):'—'}
function badge(text:string,kind:'good'|'warn'|'neutral'='neutral'){
  const styles=kind==='good'?{background:'#eef8f0',color:'#176b2c'}:kind==='warn'?{background:'#fff8e7',color:'#8a5a00'}:{background:'#f3f3f3',color:'#555'}
  return <span style={{display:'inline-block',padding:'4px 9px',borderRadius:999,fontSize:12,fontWeight:800,...styles}}>{text}</span>
}

export default async function CustomersPage({searchParams}:{searchParams:Promise<{q?:string,type?:string,newsletter?:string}>}){
  const params=await searchParams
  const supabase=await requireAdmin()
  const {data:customers,error}=await supabase.rpc('list_admin_customer_crm')
  const list=customers??[]
  const q=String(params.q||'').trim().toLowerCase()
  const type=String(params.type||'all')
  const newsletterFilter=String(params.newsletter||'all')
  const filtered=list.filter((c:any)=>{
    const searchable=[c.full_name,c.email,c.phone,c.last_delivery_zone,c.last_delivery_address].filter(Boolean).join(' ').toLowerCase()
    const matchesSearch=!q||searchable.includes(q)
    const customerType=String(c.customer_type||'Registered').toLowerCase()
    const matchesType=type==='all'||customerType===type
    const newsletter=String(c.newsletter_status||'not_subscribed').toLowerCase()
    const matchesNewsletter=newsletterFilter==='all'||newsletter===newsletterFilter
    return matchesSearch&&matchesType&&matchesNewsletter
  })
  const total=list.length
  const buyers=list.filter((c:any)=>Number(c.total_orders)>0).length
  const returning=list.filter((c:any)=>Number(c.total_orders)>=2).length
  const newsletter=list.filter((c:any)=>String(c.newsletter_status).toLowerCase()==='subscribed').length
  const lifetime=list.reduce((sum:number,c:any)=>sum+Number(c.lifetime_spend||0),0)

  return <main className="admin-dashboard-shell">
    <div className="topbar"><div className="container"><span>Folus Emporium Administration</span><span>Customer CRM</span></div></div>
    <header className="nav"><div className="container nav-inner"><Link className="brand" href="/admin/dashboard"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Customer CRM</small></span></Link><nav className="navlinks"><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin/products">Products</Link><Link href="/admin/inventory">Inventory</Link><Link href="/admin/orders">Orders</Link><Link href="/admin/customers">Customers</Link><Link href="/admin/newsletter">Newsletter</Link><Link href="/account">Account</Link></nav></div></header>

    <section className="section" style={{paddingTop:42}}><div className="container">
      <AdminBreadcrumbs items={[{label:'Admin',href:'/admin/dashboard'},{label:'Customer CRM'}]}/>
      <div className="section-head"><div><div className="eyebrow">Customer relationships</div><h1>Customer CRM</h1><p className="muted" style={{maxWidth:820}}>See registered customers, purchase activity, lifetime value, newsletter status and recent orders in one place. This page is admin-only.</p></div><div style={{display:'flex',gap:10,flexWrap:'wrap'}}><a className="btn btn-primary" href="/admin/customers/export">Export customer CSV</a><Link className="btn btn-outline" href="/admin/orders">Open orders</Link><Link className="btn btn-outline" href="/admin/newsletter">Newsletter</Link></div></div>

      <div className="admin-dashboard-stats" style={{marginTop:22}}>
        <article className="admin-dashboard-stat"><span>Registered customers</span><strong>{total}</strong><p>Non-admin customer profiles</p></article>
        <article className="admin-dashboard-stat"><span>Customers with orders</span><strong>{buyers}</strong><p>Placed at least one order</p></article>
        <article className="admin-dashboard-stat"><span>Returning customers</span><strong>{returning}</strong><p>Placed two or more orders</p></article>
        <article className="admin-dashboard-stat"><span>Newsletter subscribers</span><strong>{newsletter}</strong><p>Currently subscribed</p></article>
        <article className="admin-dashboard-stat"><span>Customer lifetime revenue</span><strong>{money(lifetime)}</strong><p>Paid, non-cancelled orders</p></article>
      </div>

      {error?<div style={{marginTop:22,padding:14,borderRadius:12,background:'#fff1f1',color:'var(--burgundy)'}}>Unable to load customer CRM: {error.message}</div>:null}

      <section className="admin-dashboard-panel" style={{marginTop:28}}>
        <div className="section-head" style={{marginBottom:18}}><div><div className="eyebrow">Customer directory</div><h2>Customers & purchase history</h2><p className="muted" style={{marginBottom:0}}>Search and filter customers, then expand a customer to review recent order activity and products purchased.</p></div></div>
        <form method="get" style={{display:'grid',gridTemplateColumns:'minmax(220px,2fr) minmax(160px,1fr) minmax(180px,1fr) auto auto',gap:10,alignItems:'end',marginBottom:18}}>
          <label>Search<input name="q" defaultValue={params.q||''} placeholder="Name, email, phone, address..."/></label>
          <label>Customer type<select name="type" defaultValue={type}><option value="all">All types</option><option value="new">New</option><option value="returning">Returning</option><option value="registered">Registered only</option></select></label>
          <label>Newsletter<select name="newsletter" defaultValue={newsletterFilter}><option value="all">All statuses</option><option value="subscribed">Subscribed</option><option value="unsubscribed">Unsubscribed</option><option value="not_subscribed">Not subscribed</option></select></label>
          <button className="btn btn-primary">Apply filters</button>
          <Link className="btn btn-outline" href="/admin/customers">Clear</Link>
        </form>
        <p className="muted" style={{marginTop:0}}>Showing <strong>{filtered.length}</strong> of {total} customers.</p>
        {filtered.length?<div style={{display:'grid',gap:12}}>{filtered.map((c:any)=><details key={c.user_id} style={{border:'1px solid var(--line)',borderRadius:14,background:'#fff',padding:16}}>
          <summary style={{cursor:'pointer',listStyle:'none'}}>
            <div style={{display:'grid',gridTemplateColumns:'minmax(220px,1.5fr) minmax(180px,1fr) repeat(4,minmax(100px,.7fr))',gap:14,alignItems:'center'}}>
              <div><strong style={{fontSize:16}}>{c.full_name||'Customer'}</strong><div className="muted" style={{fontSize:12,marginTop:3}}>{c.email||'No email'}{c.phone?` · ${c.phone}`:''}</div></div>
              <div><div style={{fontSize:12}}>{c.last_delivery_zone?String(c.last_delivery_zone).replaceAll('_',' '):'No delivery zone yet'}</div><div className="muted" style={{fontSize:12,marginTop:3}}>Joined {niceDate(c.joined_at)}</div></div>
              <div><strong>{c.total_orders}</strong><div className="muted" style={{fontSize:12}}>Orders</div></div>
              <div><strong>{c.paid_orders}</strong><div className="muted" style={{fontSize:12}}>Paid</div></div>
              <div><strong>{money(c.lifetime_spend)}</strong><div className="muted" style={{fontSize:12}}>Lifetime spend</div></div>
              <div>{badge(c.customer_type,c.customer_type==='Returning'?'good':c.customer_type==='New'?'warn':'neutral')}<div style={{marginTop:6}}>{badge(String(c.newsletter_status).replaceAll('_',' '),String(c.newsletter_status).toLowerCase()==='subscribed'?'good':'neutral')}</div></div>
            </div>
          </summary>
          <div style={{marginTop:16,paddingTop:16,borderTop:'1px solid var(--line)'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,marginBottom:18}}>
              <div><strong>Last order</strong><div className="muted" style={{marginTop:4}}>{niceDate(c.last_order_at)}</div></div>
              <div><strong>Last order status</strong><div style={{marginTop:4}}>{c.last_order_status||'—'} / {c.last_payment_status||'—'}</div></div>
              <div><strong>Last delivery address</strong><div className="muted" style={{marginTop:4}}>{c.last_delivery_address||'—'}</div></div>
              <div><strong>Delivered orders</strong><div style={{marginTop:4}}>{c.delivered_orders}</div></div>
            </div>
            <strong style={{display:'block',color:'var(--burgundy)',marginBottom:10}}>Recent orders</strong>
            {Array.isArray(c.recent_orders)&&c.recent_orders.length?<div className="admin-dashboard-table-wrap"><table className="admin-dashboard-table"><thead><tr><th>Date</th><th>Reference</th><th>Products</th><th>Status</th><th>Payment</th><th>Total</th></tr></thead><tbody>{c.recent_orders.map((o:any)=><tr key={o.id}><td>{niceDate(o.created_at)}</td><td>{o.payment_reference||String(o.id).slice(0,8)}</td><td>{Array.isArray(o.items)&&o.items.length?o.items.map((i:any)=><div key={`${o.id}-${i.product_name}-${i.size_label}`}><strong>{i.product_name}</strong>{i.size_label?` (${i.size_label})`:''} × {i.quantity}</div>):'—'}</td><td>{o.status}</td><td>{o.payment_status}<div className="muted" style={{fontSize:11}}>{String(o.payment_method||'').replaceAll('_',' ')}</div></td><td><strong>{money(o.total)}</strong></td></tr>)}</tbody></table></div>:<div className="empty"><p>No orders yet for this customer.</p></div>}
          </div>
        </details>)}</div>:<div className="empty"><h3>No matching customers</h3><p>Try clearing or changing the current search filters.</p></div>}
      </section>
    </div></section>
  </main>
}
