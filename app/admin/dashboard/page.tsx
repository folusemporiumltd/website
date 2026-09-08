import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import './dashboard.css'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) redirect('/login?next=/admin/dashboard&mode=signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name,role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') redirect('/account')
  return { supabase, user, profile }
}

function money(value: number | string | null | undefined) {
  return `₦${Number(value ?? 0).toLocaleString('en-NG')}`
}

export default async function AdminDashboardPage() {
  const { supabase, user, profile } = await requireAdmin()

  const [
    { data: products },
    { data: variants },
    { data: orders },
    { data: customers },
    { data: categories },
  ] = await Promise.all([
    supabase.from('products').select('id,name,is_active,featured,stock_quantity').order('created_at', { ascending: false }),
    supabase.from('product_variants').select('id,product_id,size_label,stock_quantity,is_active').eq('is_active', true),
    supabase.from('orders').select('id,customer_name,email,status,payment_status,total,created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('profiles').select('id,full_name,phone,role').order('created_at', { ascending: false }).limit(100),
    supabase.from('categories').select('id,name'),
  ])

  const totalProducts = products?.length ?? 0
  const activeProducts = products?.filter((p) => p.is_active).length ?? 0
  const featuredProducts = products?.filter((p) => p.featured).length ?? 0
  const lowStockVariants = variants?.filter((v) => Number(v.stock_quantity) <= 5).length ?? 0
  const totalOrders = orders?.length ?? 0
  const pendingOrders = orders?.filter((o) => o.status === 'pending' || o.status === 'processing').length ?? 0
  const paidOrders = orders?.filter((o) => o.payment_status === 'paid') ?? []
  const paidRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0)
  const totalCustomers = customers?.filter((c) => c.role !== 'admin').length ?? 0
  const recentOrders = orders?.slice(0, 8) ?? []

  const cards = [
    ['Products', String(totalProducts), `${activeProducts} active · ${featuredProducts} featured`],
    ['Inventory alerts', String(lowStockVariants), 'Active variants with 5 units or fewer'],
    ['Orders', String(totalOrders), `${pendingOrders} pending / processing`],
    ['Paid revenue', money(paidRevenue), `${paidOrders.length} paid orders in current loaded history`],
    ['Customers', String(totalCustomers), 'Registered customer profiles'],
    ['Categories', String(categories?.length ?? 0), 'Catalogue categories'],
  ]

  const modules = [
    { title: 'Products & Catalogue', text: 'Edit product names, descriptions, categories, prices, product images, visibility and featured status.', href: '/admin', action: 'Manage products' },
    { title: 'Inventory & Variants', text: 'Manage 100g, 250g, 500g, 1kg and 2kg prices, stock quantities and active package sizes.', href: '/admin', action: 'Manage inventory' },
    { title: 'Orders & Fulfilment', text: 'Review customer orders, payment state, processing, shipping, delivery and cancellations.', href: '/admin', action: 'Manage orders' },
    { title: 'Storefront Content', text: 'Manage the announcement bar, utility links, social links, navigation and homepage configuration.', href: '/admin', action: 'Manage storefront' },
    { title: 'Customers', text: 'View registered customer profiles and use order information for customer service and fulfilment.', href: '/admin/dashboard#customers', action: 'View customers' },
    { title: 'Payments', text: 'Monitor paid, pending and failed order payments while Paystack remains connected to checkout.', href: '/admin/dashboard#payments', action: 'View payment status' },
    { title: 'Admin Account', text: 'View your administrator account details or sign out securely.', href: '/account', action: 'My account' },
    { title: 'Live Storefront', text: 'Open the customer-facing website to confirm catalogue, navigation, product and checkout changes.', href: '/', action: 'View website' },
  ]

  return (
    <main className="admin-dashboard-shell">
      <div className="topbar"><div className="container"><span>Folus Emporium Administration</span><span>Secure administrator access</span></div></div>
      <header className="nav">
        <div className="container nav-inner">
          <Link className="brand" href="/admin/dashboard"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Admin Dashboard</small></span></Link>
          <nav className="navlinks"><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin">Manage Store</Link><Link href="/">Storefront</Link><Link href="/account">Account</Link></nav>
        </div>
      </header>

      <section className="section" style={{paddingTop:42}}>
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Administration</div>
              <h1 style={{marginBottom:8}}>Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}</h1>
              <p style={{color:'var(--muted)',maxWidth:760}}>This is your central control panel for Folus Emporium ecommerce operations. Use it to monitor the store and move directly into catalogue, inventory, order, customer, payment and storefront administration.</p>
            </div>
            <Link className="btn btn-primary" href="/admin">Open Store Manager</Link>
          </div>

          <div className="admin-dashboard-stats">
            {cards.map(([label,value,note]) => <article className="admin-dashboard-stat" key={label}><span>{label}</span><strong>{value}</strong><p>{note}</p></article>)}
          </div>

          <div className="admin-dashboard-grid" style={{marginTop:28}}>
            {modules.map((module) => <article className="admin-dashboard-module" key={module.title}><h2>{module.title}</h2><p>{module.text}</p><Link className="btn btn-outline" href={module.href}>{module.action}</Link></article>)}
          </div>

          <section id="payments" className="admin-dashboard-panel" style={{marginTop:34}}>
            <div className="section-head" style={{marginBottom:18}}><div><div className="eyebrow">Payments & orders</div><h2>Recent activity</h2></div><Link className="btn btn-outline" href="/admin">Manage all loaded orders</Link></div>
            {recentOrders.length ? <div className="admin-dashboard-table-wrap"><table className="admin-dashboard-table"><thead><tr><th>Order</th><th>Customer</th><th>Order status</th><th>Payment</th><th>Total</th><th>Date</th></tr></thead><tbody>{recentOrders.map(order => <tr key={order.id}><td>#{order.id.slice(0,8)}</td><td>{order.customer_name || order.email || 'Customer'}</td><td>{order.status}</td><td>{order.payment_status}</td><td>{money(order.total)}</td><td>{new Date(order.created_at).toLocaleDateString('en-NG')}</td></tr>)}</tbody></table></div> : <p className="muted">No orders yet.</p>}
          </section>

          <section id="customers" className="admin-dashboard-panel" style={{marginTop:24}}>
            <div className="section-head" style={{marginBottom:18}}><div><div className="eyebrow">Customers</div><h2>Registered profiles</h2></div></div>
            {customers?.length ? <div className="admin-dashboard-table-wrap"><table className="admin-dashboard-table"><thead><tr><th>Name</th><th>Phone</th><th>Role</th></tr></thead><tbody>{customers.slice(0,20).map(customer => <tr key={customer.id}><td>{customer.full_name || 'Not provided'}</td><td>{customer.phone || 'Not provided'}</td><td>{customer.role || 'customer'}</td></tr>)}</tbody></table></div> : <p className="muted">No customer profiles yet.</p>}
          </section>

          <section className="admin-dashboard-panel" style={{marginTop:24}}>
            <div className="eyebrow">Administrator</div><h2 style={{color:'var(--burgundy)'}}>Signed in securely</h2><p className="muted">{user.email}</p><div style={{display:'flex',gap:12,flexWrap:'wrap'}}><Link className="btn btn-primary" href="/admin">Manage ecommerce website</Link><Link className="btn btn-outline" href="/account">View admin account</Link><Link className="btn btn-outline" href="/">Open storefront</Link></div>
          </section>
        </div>
      </section>
    </main>
  )
}
