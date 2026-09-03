import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { email, amount, reference, callback_url, metadata } = await request.json()
    const items = Array.isArray(metadata?.items) ? metadata.items : []
    const delivery = metadata?.delivery_address || {}

    if (!email || !reference || !callback_url || !items.length) {
      return NextResponse.json({ error: 'Missing required payment details.' }, { status: 400 })
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: 'Paystack is not configured on the server.' }, { status: 500 })
    }

    const supabase = await createClient()
    const deliveryAddress = [delivery.address, delivery.city, delivery.state].filter(Boolean).join(', ')
    const { data: orderId, error: orderError } = await supabase.rpc('create_pending_order', {
      p_email: String(email),
      p_phone: String(metadata?.customer_phone || ''),
      p_delivery_address: deliveryAddress,
      p_items: items.map((item: { id: string; quantity: number }) => ({ id: item.id, quantity: item.quantity })),
      p_payment_reference: reference,
    })

    if (orderError || !orderId) {
      return NextResponse.json({ error: orderError?.message || 'Unable to create your order.' }, { status: 400 })
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(Number(amount) * 100),
        reference,
        callback_url,
        metadata: { ...metadata, order_id: orderId },
      }),
      cache: 'no-store',
    })

    const data = await response.json()
    if (!response.ok || !data.status) {
      return NextResponse.json({ error: data.message || 'Unable to initialize Paystack payment.' }, { status: 400 })
    }

    return NextResponse.json({ authorization_url: data.data.authorization_url, reference: data.data.reference, order_id: orderId })
  } catch {
    return NextResponse.json({ error: 'Unable to initialize payment.' }, { status: 500 })
  }
}
