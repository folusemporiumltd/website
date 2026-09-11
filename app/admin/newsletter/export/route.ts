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

  const { data: rows, error } = await supabase.rpc('list_admin_newsletter_subscribers')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const header = ['Full Name', 'Email', 'Status', 'Source', 'Consent Date', 'Unsubscribed Date']
  const lines = [header.map(csvCell).join(',')]
  for (const row of rows ?? []) {
    lines.push([
      row.full_name,
      row.email,
      row.status,
      row.source,
      row.consent_at ? new Date(row.consent_at).toISOString() : '',
      row.unsubscribed_at ? new Date(row.unsubscribed_at).toISOString() : '',
    ].map(csvCell).join(','))
  }

  const filename = `folus-newsletter-subscribers-${new Date().toISOString().slice(0,10)}.csv`
  return new NextResponse('\uFEFF' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
