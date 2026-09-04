'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from './cart-provider'

type Product = { id: string; name: string; slug: string; price: number; image_url?: string | null }

export default function ProductCardActions({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    if (product.price <= 0) return
    addItem(product)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1600)
  }

  return <div className="product-actions"><Link className="btn btn-outline" href={`/shop/${product.slug}`}>View product</Link><button className="btn btn-primary" onClick={handleAdd} disabled={product.price <= 0}>{product.price <= 0 ? 'Price unavailable' : added ? '✓ Added' : 'Add to cart'}</button></div>
}
