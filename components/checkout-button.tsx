'use client'

import Link from 'next/link'

export default function CheckoutButton() {
  return <Link className="btn btn-primary checkout-btn" href="/checkout">Proceed to checkout</Link>
}
