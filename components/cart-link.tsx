'use client'

import Link from 'next/link'
import { useCart } from './cart-provider'

export default function CartLink() {
  const { count } = useCart()
  return <Link href="/cart" className="cart-link" aria-label={`Cart with ${count} items`}>Cart {count > 0 && <span className="cart-badge">{count}</span>}</Link>
}
