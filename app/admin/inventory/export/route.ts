import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function csvCell(value: unknown) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

export async function GET() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: isAdmin } = await supabase.rpc('get_my_admin_status')
  if (isAdmin !== true) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [{ data: variants, error: variantError }, { data: products, error: productError }] = await Promise.all([
    supabase.rpc('list_admin_catalogue_variants'),
    supabase.rpc('list_admin_catalogue_products'),
  ])

  if (variantError || productError) {
    return NextResponse.json({ error: variantError?.message || productError?.message || 'Inventory export failed' }, { status: 500 })
  }

  const productMap = new Map((products ?? []).map((product: any) => [product.id, product]))
  const rows = (variants ?? [])
    .filter((variant: any) => variant.is_active)
    .map((variant: any) => {
      const product: any = productMap.get(variant.product_id)
      const stock = Number(variant.stock_quantity ?? 0)
      const threshold = Number(variant.reorder_threshold ?? 5)
      const status = stock === 0 ? 'Out of stock' : stock <= threshold ? 'Low stock' : 'Healthy'
      return {
        product: product?.name || 'Product',
        category: product?.category_name || product?.category || '',
        size: variant.size_label || '',
        price: variant.price ?? '',
        stock,
        threshold,
        status,
        featured: product?.featured ? 'Yes' : 'No',
        product_active: product?.is_active ? 'Yes' : 'No',
      }
    })
    .sort((a: any, b: any) => a.product.localeCompare(b.product) || String(a.size).localeCompare(String(b.size)))

  const header = ['Product', 'Category', 'Package Size', 'Price (NGN)', 'Current Stock', 'Reorder Threshold', 'Stock Status', 'Featured', 'Product Active']
  const lines = [header.map(csvCell).join(',')]

  for (const row of rows) {
    lines.push([
      row.product,
      row.category,
      row.size,
      row.price,
      row.stock,
      row.threshold,
      row.status,
      row.featured,
      row.product_active,
    ].map(csvCell).join(','))
  }

  const filename = `folus-inventory-report-${new Date().toISOString().slice(0, 10)}.csv`
  return new NextResponse('\uFEFF' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
