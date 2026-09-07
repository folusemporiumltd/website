import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) return NextResponse.json({ error: 'Paystack is not configured.' }, { status: 500 })
  const rawBody = await request.text()
  const signature = request.headers.get('x-paystack-signature') || ''
  const expected = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex')
  if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })

  try {
    const event = JSON.parse(rawBody)
    if (event?.event !== 'charge.success') return NextResponse.json({ received: true })
    const reference = String(event?.data?.reference || '')
    const amount = Number(event?.data?.amount)
    const currency = String(event?.data?.currency || '')
    if (!reference || !Number.isFinite(amount) || amount <= 0 || currency !== 'NGN') return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 })
    const supabase = createAdminClient()
    const { data: orderId, error } = await supabase.rpc('mark_order_paid', { p_payment_reference: reference, p_amount_kobo: Math.round(amount) })
    if (error) return NextResponse.json({ error: 'Unable to update order.' }, { status: 500 })
    return NextResponse.json({ received: true, paid: Boolean(orderId) })
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 })
  }
}
