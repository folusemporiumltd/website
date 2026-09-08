'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from './cart-provider'
import WishlistButton from './wishlist-button'

type Product = { id: string; name: string; slug: string; price: number; image_url?: string | null }
type Variant = { id: string; size_grams: number; size_label: string; price: number; stock_quantity: number }

export default function ProductCardActions({ product, variant }: { product: Product; variant?: Variant | null }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    if (!variant || variant.stock_quantity <= 0 || variant.price <= 0) return
    addItem({
      id: `${product.id}:${variant.id}`,
      name: product.name,
      slug: product.slug,
      image_url: product.image_url,
      price: Number(variant.price),
      variantId: variant.id,
      sizeGrams: variant.size_grams,
      sizeLabel: variant.size_label,
    })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1600)
  }

  const unavailable = !variant || variant.stock_quantity <= 0 || variant.price <= 0

  return <div className="product-actions"><WishlistButton product={product} variant={variant}/><Link className="btn btn-outline" href={`/shop/${product.slug}`}>View product</Link><button className="btn btn-primary" onClick={handleAdd} disabled={unavailable}>{unavailable ? 'Out of stock' : added ? '✓ Added' : `Add ${variant.size_label}`}</button></div>
}
