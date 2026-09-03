import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get('reference')
  const secretKey = process.env.PAYSTACK_SECRET_KEY

  if (!reference) return NextResponse.json({ error: 'Missing payment reference.' }, { status: 400 })
  if (!secretKey) return NextResponse.json({ error: 'Paystack is not configured on the server.' }, { status: 500 })

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: 'no-store',
    })
    const data = await response.json()

    if (!response.ok || !data.status || data.data?.status !== 'success') {
      return NextResponse.json({ paid: false, message: data.message || 'Payment was not successful.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: orderId, error } = await supabase.rpc('mark_order_paid', {
      p_payment_reference: reference,
      p_amount_kobo: Number(data.data.amount),
    })

    if (error || !orderId) {
      return NextResponse.json({ error: 'Payment succeeded, but we could not confirm the order. Please contact Folus Emporium with your payment reference.' }, { status: 500 })
    }

    return NextResponse.json({ paid: true, order_id: orderId, reference })
  } catch {
    return NextResponse.json({ error: 'Unable to verify payment.' }, { status: 500 })
  }
}
