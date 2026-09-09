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
function money(value:number|string|null|undefined){return `₦${Number(value??0).toLocaleString('en-NG')}`}
export default async function AdminDashboardPage(){
  const {supabase,user,profile}=await requireAdmin()
  const [productResult,variantResult,orderResult,customerResult,categoryResult]=await Promise.all([
    supabase.rpc('list_admin_catalogue_products'),
    supabase.rpc('list_admin_catalogue_variants'),
    supabase.from('orders').select('id,customer_name,email,status,payment_status,total,created_at').order('created_at',{ascending:false}).limit(100),
    supabase.from('profiles').select('id,full_name,phone,role').order('created_at',{ascending:false}).limit(100),
    supabase.rpc('list_admin_catalogue_categories')
  ])
  const products=productResult.data??[]
  const variants=(variantResult.data??[]).filter((v:any)=>v.is_active)
  const orders=orderResult.data??[]
  const customers=customerResult.data??[]
  const categories=categoryResult.data??[]
  const totalProducts=products.length
  const activeProducts=products.filter((p:any)=>p.is_active).length
  const featuredProducts=products.filter((p:any)=>p.featured).length
  const lowStockVariants=variants.filter((v:any)=>Number(v.stock_quantity)<=5).length
  const totalOrders=orders.length
  const pendingOrders=orders.filter((o:any)=>o.status==='pending'||o.status==='processing').length
  const paidOrders=orders.filter((o:any)=>o.payment_status==='paid')
  const paidRevenue=paidOrders.reduce((sum:number,o:any)=>sum+Number(o.total??0),0)
  const totalCustomers=customers.filter((c:any)=>c.role!=='admin').length
  const recentOrders=orders.slice(0,8)
  const cards=[['Products',String(totalProducts),`${activeProducts} active · ${featuredProducts} featured`],['Inventory alerts',String(lowStockVariants),'Active variants with 5 units or fewer'],['Orders',String(totalOrders),`${pendingOrders} pending / processing`],['Paid revenue',money(paidRevenue),`${paidOrders.length} paid orders`],['Customers',String(totalCustomers),'Registered customer profiles'],['Categories',String(categories.length),'Catalogue categories']]
  const modules=[{title:'Products & Catalogue',text:'Manage products, flyers, descriptions, categories, package sizes, prices, stock quantities, visibility and featured status in one place.',href:'/admin/products',action:'Manage products'},{title:'Orders & Fulfilment',text:'Review orders, payment state, processing, shipping, delivery and cancellations.',href:'/admin/orders',action:'Manage orders'},{title:'Discount Coupons',text:'Create, activate and manage customer discount codes.',href:'/admin/coupons',action:'Manage coupons'},{title:'Admin Roles',text:'Control which registered accounts can access ecommerce administration.',href:'/admin/users',action:'Manage roles'},{title:'Storefront Content',text:'Manage announcement, navigation and social links using simple form fields.',href:'/admin/storefront',action:'Manage storefront'},{title:'Manage Company Information',text:'Edit About Us, Our Story and Careers, and create, save or publish Blog articles without rebuilding the website.',href:'/admin/company',action:'Manage company content'},{title:'Admin Account',text:'View administrator account details or sign out securely.',href:'/account',action:'My account'},{title:'Live Storefront',text:'Open the customer-facing website to confirm your changes.',href:'/',action:'View website'}]
  return <main className="admin-dashboard-shell"><div className="topbar"><div className="container"><span>Folus Emporium Administration</span><span>Secure administrator access</span></div></div><header className="nav"><div className="container nav-inner"><Link className="brand" href="/admin/dashboard"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Admin Dashboard</small></span></Link><nav className="navlinks"><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin/products">Products</Link><Link href="/admin/orders">Orders</Link><Link href="/admin/storefront">Storefront Content</Link><Link href="/admin/company">Company Info</Link><Link href="/admin/coupons">Coupons</Link><Link href="/admin/users">Roles</Link><Link href="/account">Account</Link></nav></div></header><section className="section" style={{paddingTop:42}}><div className="container"><AdminBreadcrumbs items={[{label:'Admin'},{label:'Dashboard'}]}/><div className="section-head"><div><div className="eyebrow">Administration</div><h1 style={{marginBottom:8}}>Welcome{profile?.full_name?`, ${profile.full_name}`:''}</h1><p style={{color:'var(--muted)',maxWidth:760}}>Your central control panel for Folus Emporium ecommerce operations.</p></div><Link className="btn btn-primary" href="/admin/products">Open Product Manager</Link></div><div className="admin-dashboard-stats">{cards.map(([l,v,n])=><article className="admin-dashboard-stat" key={l}><span>{l}</span><strong>{v}</strong><p>{n}</p></article>)}</div><div className="admin-dashboard-grid" style={{marginTop:28}}>{modules.map(m=><article className="admin-dashboard-module" key={m.title}><h2>{m.title}</h2><p>{m.text}</p><Link className="btn btn-outline" href={m.href}>{m.action}</Link></article>)}</div><section id="payments" className="admin-dashboard-panel" style={{marginTop:34}}><div className="section-head" style={{marginBottom:18}}><div><div className="eyebrow">Payments & orders</div><h2>Recent activity</h2></div><Link className="btn btn-outline" href="/admin/orders">Manage orders</Link></div>{recentOrders.length?<div className="admin-dashboard-table-wrap"><table className="admin-dashboard-table"><thead><tr><th>Order</th><th>Customer</th><th>Order status</th><th>Payment</th><th>Total</th><th>Date</th></tr></thead><tbody>{recentOrders.map((o:any)=><tr key={o.id}><td>#{o.id.slice(0,8)}</td><td>{o.customer_name||o.email||'Customer'}</td><td>{o.status}</td><td>{o.payment_status}</td><td>{money(o.total)}</td><td>{new Date(o.created_at).toLocaleDateString('en-NG')}</td></tr>)}</tbody></table></div>:<p className="muted">No orders yet.</p>}</section><section id="customers" className="admin-dashboard-panel" style={{marginTop:24}}><div className="eyebrow">Customers</div><h2>Registered profiles</h2>{customers.length?<div className="admin-dashboard-table-wrap"><table className="admin-dashboard-table"><thead><tr><th>Name</th><th>Phone</th><th>Role</th></tr></thead><tbody>{customers.slice(0,20).map((c:any)=><tr key={c.id}><td>{c.full_name||'Not provided'}</td><td>{c.phone||'Not provided'}</td><td>{c.role||'customer'}</td></tr>)}</tbody></table></div>:<p className="muted">No customer profiles yet.</p>}</section><section className="admin-dashboard-panel" style={{marginTop:24}}><div className="eyebrow">Administrator</div><h2 style={{color:'var(--burgundy)'}}>Signed in securely</h2><p className="muted">{user.email}</p></section></div></section></main>
}