import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, amount, reference, callback_url, metadata } = await request.json()

    if (!email || !amount || !reference || !callback_url) {
      return NextResponse.json({ error: 'Missing required payment details.' }, { status: 400 })
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: 'Paystack is not configured on the server.' }, { status: 500 })
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
        metadata,
      }),
      cache: 'no-store',
    })

    const data = await response.json()
    if (!response.ok || !data.status) {
      return NextResponse.json({ error: data.message || 'Unable to initialize Paystack payment.' }, { status: 400 })
    }

    return NextResponse.json({ authorization_url: data.data.authorization_url, reference: data.data.reference })
  } catch {
    return NextResponse.json({ error: 'Unable to initialize payment.' }, { status: 500 })
  }
}
