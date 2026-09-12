import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

function validDate(value: string | null) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return NextResponse.json({ error: 'You must be signed in as an administrator.' }, { status: 401 })

  const { data: isAdmin, error: adminError } = await supabase.rpc('get_my_admin_status')
  if (adminError || isAdmin !== true) return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 })

  const url = new URL(request.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  if (!validDate(from) || !validDate(to)) return NextResponse.json({ error: 'A valid From and To date is required.' }, { status: 400 })

  const fromIso = new Date(`${from}T00:00:00.000Z`).toISOString()
  const toIso = new Date(`${to}T23:59:59.999Z`).toISOString()
  const { data, error } = await supabase.rpc('get_admin_management_reports', { p_from: fromIso, p_to: toIso })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const report: any = data || {}
  const summary = report.summary || {}
  const inventory = report.inventory || {}
  const rows: string[][] = []

  rows.push(['Folus Emporium Reports & Analytics'])
  rows.push(['Reporting period', from!, to!])
  rows.push([])
  rows.push(['Section', 'Item', 'Metric', 'Value', 'Metric 2', 'Value 2'])

  const summaryRows: [string, unknown][] = [
    ['Net revenue', summary.net_revenue ?? 0],
    ['Paid orders', summary.paid_orders ?? 0],
    ['Total orders', summary.orders ?? 0],
    ['Average order value', summary.average_order_value ?? 0],
    ['Unique paying customers', summary.unique_customers ?? 0],
    ['Discounts', summary.discounts ?? 0],
    ['Delivery fees', summary.delivery_fees ?? 0],
  ]
  summaryRows.forEach(([metric, value]) => rows.push(['Summary', '', metric, value == null ? '' : String(value), '', '']))

  for (const product of report.products || []) rows.push(['Product performance', product.product_name || '', 'Units sold', String(product.units_sold ?? 0), 'Sales', String(product.revenue ?? 0)])
  for (const payment of report.payment_methods || []) rows.push(['Payment methods', String(payment.method || '').replaceAll('_', ' '), 'Orders', String(payment.orders ?? 0), 'Revenue', String(payment.revenue ?? 0)])
  for (const status of report.order_statuses || []) rows.push(['Order statuses', status.status || '', 'Orders', String(status.orders ?? 0), '', ''])

  rows.push(['Inventory snapshot', '', 'Stock units', String(inventory.stock_units ?? 0), 'Retail stock value', String(inventory.retail_stock_value ?? 0)])
  rows.push(['Inventory snapshot', '', 'Out of stock', String(inventory.out_of_stock ?? 0), 'Low stock', String(inventory.low_stock ?? 0)])

  for (const customer of report.customers || []) rows.push(['Customer value', customer.customer_name || '', 'Email', customer.email || '', 'Paid orders', String(customer.orders ?? 0)])
  for (const customer of report.customers || []) rows.push(['Customer value', customer.customer_name || '', 'Spend', String(customer.spend ?? 0), '', ''])

  const csv = '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n')
  const filename = `folus-emporium-reports-${from}-to-${to}.csv`

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
