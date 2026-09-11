import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import AdminBreadcrumbs from '@/components/admin-breadcrumbs'
import { loadOrderForEmail, sendOrderEmail } from '@/lib/order-email'

async function requireAdmin() {
  const s = await createClient()
  const { data: a } = await s.auth.getUser()
  if (!a.user) redirect('/login?next=/admin/orders&mode=signin')
  const { data: isAdmin, error } = await s.rpc('get_my_admin_status')
  if (error || isAdmin !== true) redirect('/account?admin_error=access')
  return s
}

async function updateOrder(f: FormData) {
  'use server'
  const s = await requireAdmin()
  const id = String(f.get('id') || '')
  const status = String(f.get('status') || '')
  const payment = String(f.get('payment_status') || '')
  if (!id || !['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status) || !['pending', 'paid', 'failed', 'refunded'].includes(payment)) redirect('/admin/orders?error=invalid')

  const before = await loadOrderForEmail(id)
  const { data, error } = await s.rpc('admin_update_order_status', { p_order_id: id, p_status: status, p_payment_status: payment })
  if (error || !data) redirect(`/admin/orders?error=${encodeURIComponent(error?.message || 'Unable to update order')}`)

  const after = await loadOrderForEmail(id)
  if (after && before?.status !== status) await sendOrderEmail(after, `status_${status}`)
  if (after && before?.payment_status !== payment && payment === 'paid') await sendOrderEmail(after, 'payment_confirmed')

  revalidatePath('/admin/orders')
  revalidatePath('/admin/dashboard')
  revalidatePath('/account')
  redirect('/admin/orders?updated=1')
}

function money(v: number | string | null | undefined) {
  return `₦${Number(v ?? 0).toLocaleString('en-NG')}`
}

function emailEventLabel(key: string) {
  const labels: Record<string, string> = {
    order_confirmed: 'Order confirmation',
    payment_confirmed: 'Payment confirmation',
    status_pending: 'Pending update',
    status_processing: 'Processing update',
    status_shipped: 'Shipped update',
    status_delivered: 'Delivered update',
    status_cancelled: 'Cancellation update',
  }
  return labels[key] || key.replaceAll('_', ' ')
}

function statusBadge(status: string) {
  const normalized = String(status || '').toLowerCase()
  const palette: Record<string, { bg: string; fg: string }> = {
    sent: { bg: '#eef8f0', fg: '#176b2c' },
    skipped: { bg: '#fff8e7', fg: '#8a5a00' },
    failed: { bg: '#fff1f1', fg: '#8b1e2d' },
    pending: { bg: '#f3f3f3', fg: '#555' },
  }
  const p = palette[normalized] || palette.pending
  return <span style={{ display: 'inline-block', padding: '4px 9px', borderRadius: 999, background: p.bg, color: p.fg, fontSize: 12, fontWeight: 800, textTransform: 'capitalize' }}>{normalized || 'pending'}</span>
}

export default async function OrdersPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {}
  const s = await requireAdmin()
  const [{ data: orders, error: listError }, { data: emailHistory, error: emailHistoryError }] = await Promise.all([
    s.rpc('list_admin_orders'),
    s.rpc('list_admin_order_email_history'),
  ])

  const logsByOrder = new Map<string, any[]>()
  for (const log of emailHistory || []) {
    const key = String(log.order_id)
    const current = logsByOrder.get(key) || []
    current.push(log)
    logsByOrder.set(key, current)
  }

  const updated = params?.updated === '1'
  const rawError = typeof params?.error === 'string' ? params.error : ''

  return <main>
    <div className="topbar"><div className="container"><span>Folus Emporium Administration</span><span>Orders & fulfilment</span></div></div>
    <header className="nav"><div className="container nav-inner"><Link className="brand" href="/admin/dashboard"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Order Manager</small></span></Link><nav className="navlinks"><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin/products">Products</Link><Link href="/admin/storefront">Storefront</Link><Link href="/admin/coupons">Coupons</Link><Link href="/admin/users">Roles</Link></nav></div></header>
    <section className="section"><div className="container" style={{ maxWidth: 1180 }}>
      <AdminBreadcrumbs items={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Orders & Fulfilment' }]}/>
      <div className="eyebrow">Commerce operations</div>
      <h1>Orders & Fulfilment</h1>
      <p className="muted">Review customer orders, products purchased, payment state, delivery details, transactional email history, invoices and receipts, and move each order through fulfilment.</p>
      {updated ? <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 12, background: '#eef8f0', fontWeight: 700 }}>Order updated successfully.</div> : null}
      {rawError ? <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 12, background: '#fff1f1', color: 'var(--burgundy)', fontWeight: 700 }}>Update failed: {rawError === 'invalid' ? 'Invalid order update.' : rawError}</div> : null}
      {listError ? <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 12, background: '#fff1f1', color: 'var(--burgundy)' }}>Unable to load orders: {listError.message}</div> : null}
      {emailHistoryError ? <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: '#fff8e7', color: '#8a5a00' }}>Email history is temporarily unavailable: {emailHistoryError.message}</div> : null}

      <div style={{ display: 'grid', gap: 14, marginTop: 24 }}>
        {orders?.length ? orders.map((o: any) => {
          const emailLogs = logsByOrder.get(String(o.id)) || []
          return <form key={o.id} action={updateOrder} style={{ border: '1px solid var(--line)', borderRadius: 16, padding: 18, background: '#fff' }}>
            <input type="hidden" name="id" value={o.id}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 650px' }}>
                <strong>{o.payment_reference || `Order #${o.id.slice(0, 8)}`}</strong>
                <div className="muted" style={{ marginTop: 4 }}>{o.customer_name || 'Customer'} · {o.email || 'No email'} · {new Date(o.created_at).toLocaleString('en-NG')}</div>
                <div style={{ marginTop: 7 }}>{o.phone || 'No phone'}{o.delivery_address ? ` · ${o.delivery_address}` : ''}</div>
                <div style={{ marginTop: 7 }}>{o.delivery_zone ? `Delivery zone: ${String(o.delivery_zone).replace('_', ' ')}` : ''}{o.payment_method ? ` · Payment method: ${String(o.payment_method).replaceAll('_', ' ')}` : ''}</div>

                <div style={{ marginTop: 14, padding: '14px 16px', border: '1px solid var(--line)', borderRadius: 12, background: '#faf8f5' }}>
                  <strong style={{ display: 'block', marginBottom: 9, color: 'var(--burgundy)' }}>Products ordered</strong>
                  {Array.isArray(o.items) && o.items.length ? o.items.map((item: any, index: number) => <div key={`${item.product_id || index}-${item.variant_id || index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '9px 0', borderTop: index ? '1px solid var(--line)' : 'none', flexWrap: 'wrap' }}><div><strong>{item.product_name || 'Product'}</strong><div className="muted" style={{ marginTop: 3 }}>{item.size_label ? `Size: ${item.size_label}` : item.size_grams ? `Size: ${item.size_grams}g` : ''}{(item.size_label || item.size_grams) ? ' · ' : ''}Quantity: {item.quantity}</div></div><div style={{ textAlign: 'right' }}><strong>{money(item.line_total)}</strong><div className="muted" style={{ marginTop: 3 }}>{money(item.unit_price)} each</div></div></div>) : <span className="muted">No product details recorded for this order.</span>}
                </div>

                <div style={{ marginTop: 10 }}>Subtotal: <strong>{money(o.subtotal)}</strong> · Delivery: <strong>{money(o.delivery_fee)}</strong>{Number(o.discount_amount || 0) > 0 ? <span className="muted"> · Discount {money(o.discount_amount)}</span> : null} · Total: <strong>{money(o.total)}</strong></div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}><a className="btn btn-outline" href={`/api/orders/${o.id}/document?type=invoice`}>Download Invoice PDF</a>{o.payment_status === 'paid' ? <a className="btn btn-outline" href={`/api/orders/${o.id}/document?type=receipt`}>Download Payment Receipt PDF</a> : null}</div>

                <div style={{ marginTop: 16, border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '11px 14px', background: '#faf8f5', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><strong style={{ color: 'var(--burgundy)' }}>Customer Email History</strong><span className="muted" style={{ fontSize: 12 }}>{emailLogs.length} event{emailLogs.length === 1 ? '' : 's'}</span></div>
                  {emailLogs.length ? <div style={{ padding: '0 14px' }}>{emailLogs.map((log: any, index: number) => <div key={`${log.event_key}-${log.updated_at}-${index}`} style={{ padding: '11px 0', borderTop: index ? '1px solid var(--line)' : 'none' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}><div><strong>{emailEventLabel(String(log.event_key))}</strong><div className="muted" style={{ marginTop: 3, fontSize: 12 }}>To: {log.recipient_email || 'No recipient'} · {new Date(log.updated_at || log.created_at).toLocaleString('en-NG')}</div></div>{statusBadge(String(log.status || 'pending'))}</div>{log.provider_email_id ? <div className="muted" style={{ marginTop: 5, fontSize: 12 }}>Provider ID: {log.provider_email_id}</div> : null}{log.error_message ? <div style={{ marginTop: 5, fontSize: 12, color: String(log.status).toLowerCase() === 'failed' ? '#8b1e2d' : '#8a5a00' }}>{log.error_message}</div> : null}</div>)}</div> : <div className="muted" style={{ padding: 14 }}>No transactional email has been recorded for this order yet.</div>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
                <label>Order status<select name="status" defaultValue={o.status}><option value="pending">Pending</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></label>
                <label>Payment<select name="payment_status" defaultValue={o.payment_status}><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></label>
                <button type="submit" className="btn btn-primary">Update order</button>
              </div>
            </div>
          </form>
        }) : <div className="empty"><h3>No orders yet</h3><p>Customer orders will appear here automatically.</p></div>}
      </div>
    </div></section>
  </main>
}
