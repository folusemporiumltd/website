'use client'

import Link from 'next/link'
import { useCart } from './cart-provider'

export default function CartLink() {
  const { count } = useCart()
  return <Link href="/cart" className="cart-link" aria-label={`Cart with ${count} items`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 11.1a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.5L20 8H6.1"/><circle cx="10" cy="20" r="1.2"/><circle cx="17" cy="20" r="1.2"/></svg><span>Cart</span>{count > 0 && <span className="cart-badge">{count}</span>}</Link>
}
