'use client'

import { useState } from 'react'
import { useCart } from './cart-provider'

export default function AddToCart({ product }: { product: { id: string; name: string; slug: string; price: number; image_url?: string | null } }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    if (product.price <= 0) return
    addItem(product)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
  }

  return <button className="btn btn-primary" onClick={handleAdd} disabled={product.price <= 0}>
    {product.price <= 0 ? 'Price to be updated' : added ? '✓ Added to cart' : 'Add to cart'}
  </button>
}
