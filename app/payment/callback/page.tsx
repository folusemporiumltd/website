'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/components/cart-provider'

export default function PaymentCallbackPage() {
  const params = useSearchParams()
  const { clearCart } = useCart()
  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking')
  const [message, setMessage] = useState('Confirming your payment…')

  useEffect(() => {
    const reference = params.get('reference')
    if (!reference) {
      setStatus('failed')
      setMessage('No payment reference was found.')
      return
    }

    fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`, { cache: 'no-store' })
      .then(async response => {
        const data = await response.json()
        if (!response.ok || !data.paid) throw new Error(data.message || data.error || 'Payment could not be confirmed.')
        clearCart()
        setStatus('success')
        setMessage(`Payment confirmed. Your order reference is ${reference}.`)
      })
      .catch(error => {
        setStatus('failed')
        setMessage(error instanceof Error ? error.message : 'Payment could not be confirmed.')
      })
  }, [params, clearCart])

  return (
    <main>
      <section className="section">
        <div className="container empty">
          <div className="eyebrow">Folus Emporium</div>
          <h1>{status === 'checking' ? 'Confirming payment' : status === 'success' ? 'Payment successful' : 'Payment confirmation needed'}</h1>
          <p>{message}</p>
          {status === 'success' ? <Link className="btn btn-primary" href="/shop">Continue shopping</Link> : status === 'failed' ? <><Link className="btn btn-primary" href="/cart">Return to cart</Link> <Link className="btn" href="/shop">Shop</Link></> : <p className="muted">Please wait while we securely verify your transaction.</p>}
        </div>
      </section>
    </main>
  )
}
