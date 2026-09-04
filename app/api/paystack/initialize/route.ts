import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type CheckoutItem = { id: string; quantity: number }

export async function POST(request: Request) {
  try {
    const { email, reference, callback_url, metadata } = await request.json()
    const items: CheckoutItem[] = Array.isArray(metadata?.items) ? metadata.items : []
    const delivery = metadata?.delivery_address || {}

    if (!email || !reference || !callback_url || !items.length) {
      return NextResponse.json({ error: 'Missing required payment details.' }, { status: 400 })
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: 'Paystack is not configured on the server.' }, { status: 500 })
    }

    const supabase = await createClient()
    const productIds = items.map(item => item.id).filter(Boolean)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id,price,stock_quantity,is_active')
      .in('id', productIds)

    if (productsError || !products?.length) {
      return NextResponse.json({ error: 'Unable to validate your cart.' }, { status: 400 })
    }

    const byId = new Map(products.map(product => [product.id, product]))
    let subtotal = 0
    for (const item of items) {
      const product = byId.get(item.id)
      const quantity = Math.max(1, Math.min(Math.floor(Number(item.quantity) || 1), 100))
      if (!product || !product.is_active || product.stock_quantity < quantity) {
        return NextResponse.json({ error: 'One or more products are unavailable or out of stock.' }, { status: 400 })
      }
      subtotal += Number(product.price) * quantity
    }

    const deliveryFee = 0
    const total = subtotal + deliveryFee
    const deliveryAddress = [delivery.address, delivery.city, delivery.state].filter(Boolean).join(', ')
    const { data: orderId, error: orderError } = await supabase.rpc('create_pending_order', {
      p_email: String(email),
      p_phone: String(metadata?.customer_phone || ''),
      p_delivery_address: deliveryAddress,
      p_items: items.map(item => ({ id: item.id, quantity: Math.max(1, Math.min(Math.floor(Number(item.quantity) || 1), 100)) })),
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
        email: String(email),
        amount: Math.round(total * 100),
        reference,
        callback_url,
        metadata: { ...metadata, order_id: orderId, subtotal, delivery_fee: deliveryFee, total },
      }),
      cache: 'no-store',
    })

    const data = await response.json()
    if (!response.ok || !data.status) {
      return NextResponse.json({ error: data.message || 'Unable to initialize Paystack payment.' }, { status: 400 })
    }

    return NextResponse.json({ authorization_url: data.data.authorization_url, reference: data.data.reference, order_id: orderId, total })
  } catch {
    return NextResponse.json({ error: 'Unable to initialize payment.' }, { status: 500 })
  }
}
