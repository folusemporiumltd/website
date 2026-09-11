import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminBreadcrumbs from '@/components/admin-breadcrumbs'
import './dashboard.css'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) redirect('/login?next=/admin/dashboard&mode=signin')
  const { data: isAdmin, error: adminError } = await supabase.rpc('get_my_admin_status')
  if (adminError || isAdmin !== true) redirect('/account?admin_error=access')
  const { data: profile } = await supabase.from('profiles').select('full_name,role').eq('id', user.id).maybeSingle()
  return { supabase, user, profile }
}
function money(value:number|string|null|undefined){return `₦${Number(value??0).toLocaleString('en-NG',{maximumFractionDigits:0})}`}
function label(value:string|null|undefined){return String(value||'Not specified').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
export default async function AdminDashboardPage(){
  const {supabase,user,profile}=await requireAdmin()
  const [productResult,variantResult,orderResult,customerResult,categoryResult,analyticsResult]=await Promise.all([
    supabase.rpc('list_admin_catalogue_products'),
    supabase.rpc('list_admin_catalogue_variants'),
    supabase.rpc('list_admin_orders'),
    supabase.rpc('list_admin_customer_profiles'),
    supabase.rpc('list_admin_catalogue_categories'),
    supabase.rpc('get_admin_sales_analytics')
  ])
  const products=productResult.data??[]
  const variants=(variantResult.data??[]).filter((v:any)=>v.is_active)
  const orders=orderResult.data??[]
  const customers=customerResult.data??[]
  const categories=categoryResult.data??[]
  const analytics:any=analyticsResult.data??{}
  const summary=analytics.summary??{}
  const topProducts=Array.isArray(analytics.top_products)?analytics.top_products:[]
  const paymentMethods=Array.isArray(analytics.payment_methods)?analytics.payment_methods:[]
  const orderStatuses=Array.isArray(analytics.order_statuses)?analytics.order_statuses:[]
  const totalProducts=products.length
  const activeProducts=products.filter((p:any)=>p.is_active).length
  const featuredProducts=products.filter((p:any)=>p.featured).length
  const lowStockVariants=variants.filter((v:any)=>Number(v.stock_quantity)<=5).length
  const totalOrders=orders.length
  const pendingOrders=orders.filter((o:any)=>o.status==='pending'||o.status==='processing').length
  const paidOrders=orders.filter((o:any)=>o.payment_status==='paid')
  const paidRevenue=Number(summary.revenue??paidOrders.reduce((sum:number,o:any)=>sum+Number(o.total??0),0))
  const averageOrderValue=Number(summary.average_order_value??0)
  const revenue30d=Number(summary.revenue_30d??0)
  const paidOrders30d=Number(summary.paid_orders_30d??0)
  const totalCustomers=customers.filter((c:any)=>c.role!=='admin').length
  const recentOrders=orders.slice(0,8)
  const cards=[['Products',String(totalProducts),`${activeProducts} active · ${featuredProducts} featured`],['Inventory alerts',String(lowStockVariants),'Active variants with 5 units or fewer'],['Orders',String(totalOrders),`${pendingOrders} pending / processing`],['Paid revenue',money(paidRevenue),`${paidOrders.length} paid orders`],['Average order',money(averageOrderValue),'Average paid order value'],['Customers',String(totalCustomers),'Registered customer profiles']]
  const modules=[{title:'Products & Catalogue',text:'Manage products, flyers, descriptions, categories, package sizes, prices, stock quantities, visibility and featured status in one place.',href:'/admin/products',action:'Manage products'},{title:'Orders & Fulfilment',text:'Review orders, payment state, processing, shipping, delivery and cancellations.',href:'/admin/orders',action:'Manage orders'},{title:'Newsletter & Email List',text:'View opted-in customers, create newsletters, send campaigns and review campaign history.',href:'/admin/newsletter',action:'Manage newsletter'},{title:'Discount Coupons',text:'Create, activate and manage customer discount codes.',href:'/admin/coupons',action:'Manage coupons'},{title:'Admin Roles',text:'Control which registered accounts can access ecommerce administration.',href:'/admin/users',action:'Manage roles'},{title:'Storefront Content',text:'Manage announcement, navigation and social links using simple form fields.',href:'/admin/storefront',action:'Manage storefront'},{title:'Manage Company Information',text:'Edit About Us, Our Story and Careers, and create, save or publish Blog articles without rebuilding the website.',href:'/admin/company',action:'Manage company content'},{title:'Admin Account',text:'View administrator account details or sign out securely.',href:'/account',action:'My account'},{title:'Live Storefront',text:'Open the customer-facing website to confirm your changes.',href:'/',action:'View website'}]
  return <main className="admin-dashboard-shell"><div className="topbar"><div className="container"><span>Folus Emporium Administration</span><span>Secure administrator access</span></div></div><header className="nav"><div className="container nav-inner"><Link className="brand" href="/admin/dashboard"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Admin Dashboard</small></span></Link><nav className="navlinks"><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin/products">Products</Link><Link href="/admin/orders">Orders</Link><Link href="/admin/newsletter">Newsletter</Link><Link href="/admin/storefront">Storefront Content</Link><Link href="/admin/company">Company Info</Link><Link href="/admin/coupons">Coupons</Link><Link href="/admin/users">Roles</Link><Link href="/account">Account</Link></nav></div></header><section className="section" style={{paddingTop:42}}><div className="container"><AdminBreadcrumbs items={[{label:'Admin'},{label:'Dashboard'}]}/><div className="section-head"><div><div className="eyebrow">Administration</div><h1 style={{marginBottom:8}}>Welcome{profile?.full_name?`, ${profile.full_name}`:''}</h1><p style={{color:'var(--muted)',maxWidth:760}}>Your central control panel for Folus Emporium ecommerce operations.</p></div><Link className="btn btn-primary" href="/admin/products">Open Product Manager</Link></div><div className="admin-dashboard-stats">{cards.map(([l,v,n])=><article className="admin-dashboard-stat" key={l}><span>{l}</span><strong>{v}</strong><p>{n}</p></article>)}</div>

  <section className="admin-dashboard-panel" style={{marginTop:34}}><div className="section-head" style={{marginBottom:18}}><div><div className="eyebrow">Sales analytics</div><h2>Business performance</h2><p className="muted" style={{marginBottom:0}}>Calculated from confirmed paid orders. Cancelled orders are excluded from revenue.</p></div></div><div className="admin-dashboard-stats"><article className="admin-dashboard-stat"><span>Last 30 days revenue</span><strong>{money(revenue30d)}</strong><p>{paidOrders30d} paid orders</p></article><article className="admin-dashboard-stat"><span>Lifetime paid revenue</span><strong>{money(paidRevenue)}</strong><p>{Number(summary.paid_orders??paidOrders.length)} successful paid orders</p></article><article className="admin-dashboard-stat"><span>Average order value</span><strong>{money(averageOrderValue)}</strong><p>Across paid, non-cancelled orders</p></article></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:18,marginTop:22}}><div><h3 style={{color:'var(--burgundy)'}}>Top-selling products</h3>{topProducts.length?<div className="admin-dashboard-table-wrap"><table className="admin-dashboard-table"><thead><tr><th>Product</th><th>Units</th><th>Sales</th></tr></thead><tbody>{topProducts.map((p:any)=><tr key={p.product_name}><td>{p.product_name}</td><td>{p.units_sold}</td><td>{money(p.sales)}</td></tr>)}</tbody></table></div>:<p className="muted">Top products will appear after paid orders are recorded.</p>}</div><div><h3 style={{color:'var(--burgundy)'}}>Payment methods</h3>{paymentMethods.length?<div className="admin-dashboard-table-wrap"><table className="admin-dashboard-table"><thead><tr><th>Method</th><th>Orders</th><th>Revenue</th></tr></thead><tbody>{paymentMethods.map((p:any)=><tr key={p.method}><td>{label(p.method)}</td><td>{p.orders}</td><td>{money(p.revenue)}</td></tr>)}</tbody></table></div>:<p className="muted">Payment analytics will appear after successful payments.</p>}</div></div>{orderStatuses.length?<div style={{marginTop:22}}><h3 style={{color:'var(--burgundy)'}}>Order status overview</h3><div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{orderStatuses.map((s:any)=><span key={s.status} style={{padding:'9px 12px',border:'1px solid var(--line)',borderRadius:999,background:'#fff',fontWeight:700}}>{label(s.status)}: {s.orders}</span>)}</div></div>:null}</section>

  <div className="admin-dashboard-grid" style={{marginTop:28}}>{modules.map(m=><article className="admin-dashboard-module" key={m.title}><h2>{m.title}</h2><p>{m.text}</p><Link className="btn btn-outline" href={m.href}>{m.action}</Link></article>)}</div><section id="payments" className="admin-dashboard-panel" style={{marginTop:34}}><div className="section-head" style={{marginBottom:18}}><div><div className="eyebrow">Payments & orders</div><h2>Recent activity</h2></div><Link className="btn btn-outline" href="/admin/orders">Manage orders</Link></div>{recentOrders.length?<div className="admin-dashboard-table-wrap"><table className="admin-dashboard-table"><thead><tr><th>Order</th><th>Customer</th><th>Order status</th><th>Payment</th><th>Total</th><th>Date</th></tr></thead><tbody>{recentOrders.map((o:any)=><tr key={o.id}><td>{o.payment_reference||`#${o.id.slice(0,8)}`}</td><td>{o.customer_name||o.email||'Customer'}</td><td>{o.status}</td><td>{o.payment_status}</td><td>{money(o.total)}</td><td>{new Date(o.created_at).toLocaleDateString('en-NG')}</td></tr>)}</tbody></table></div>:<p className="muted">No orders yet.</p>}</section><section id="customers" className="admin-dashboard-panel" style={{marginTop:24}}><div className="eyebrow">Customers</div><h2>Registered profiles</h2>{customers.length?<div className="admin-dashboard-table-wrap"><table className="admin-dashboard-table"><thead><tr><th>Name</th><th>Phone</th><th>Role</th></tr></thead><tbody>{customers.slice(0,20).map((c:any)=><tr key={c.id}><td>{c.full_name||'Not provided'}</td><td>{c.phone||'Not provided'}</td><td>{c.role||'customer'}</td></tr>)}</tbody></table></div>:<p className="muted">No customer profiles yet.</p>}</section><section className="admin-dashboard-panel" style={{marginTop:24}}><div className="eyebrow">Administrator</div><h2 style={{color:'var(--burgundy)'}}>Signed in securely</h2><p className="muted">{user.email}</p></section></div></section></main>
}
