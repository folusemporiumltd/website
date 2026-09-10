import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get('reference')
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!reference) return NextResponse.json({ error: 'Missing payment reference.' }, { status: 400 })
  if (!secretKey) return NextResponse.json({ error: 'Paystack is not configured on the server.' }, { status: 500 })
  if (!serviceRoleKey) return NextResponse.json({ error: 'Payment was received, but secure order confirmation is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the Production environment and redeploy.' }, { status: 500 })

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secretKey}` }, cache: 'no-store' })
    const data = await response.json()
    if (!response.ok || !data.status || data.data?.status !== 'success') return NextResponse.json({ paid: false, message: data.message || 'Payment was not successful.' }, { status: 400 })
    if (String(data.data?.currency || '') !== 'NGN') return NextResponse.json({ paid: false, message: 'Unexpected payment currency.' }, { status: 400 })

    const paidAmountKobo = Number(data.data?.amount)
    const requestedAmountKobo = Number(data.data?.requested_amount)
    const amountToVerify = Number.isFinite(requestedAmountKobo) && requestedAmountKobo > 0 ? requestedAmountKobo : paidAmountKobo
    if (!Number.isFinite(paidAmountKobo) || paidAmountKobo < amountToVerify) {
      return NextResponse.json({ paid: false, message: 'Invalid payment amount returned by Paystack.' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: orderId, error } = await supabase.rpc('mark_order_paid', { p_payment_reference: reference, p_amount_kobo: amountToVerify })
    if (error || !orderId) return NextResponse.json({ error: error?.message || 'Payment succeeded, but we could not confirm the order. Please contact Folus Emporium with your payment reference.' }, { status: 500 })
    return NextResponse.json({ paid: true, order_id: orderId, reference })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to verify payment.' }, { status: 500 })
  }
}
