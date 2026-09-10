'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from './cart-provider'

type Variant = { id: string; size_grams: number; size_label: string; price: number; stock_quantity: number }
type Product = { id: string; name: string; slug: string; image_url?: string | null }

export default function ProductVariantPicker({ product, variants }: { product: Product; variants: Variant[] }) {
  const { addItem } = useCart()
  const [selectedId, setSelectedId] = useState(variants.find(v => v.size_grams === 500)?.id ?? variants[0]?.id ?? '')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const selected = variants.find(v => v.id === selectedId)

  function add() {
    if (!selected || selected.stock_quantity < quantity) return
    addItem({
      id: `${product.id}:${selected.id}`,
      name: product.name,
      slug: product.slug,
      image_url: product.image_url,
      price: Number(selected.price),
      variantId: selected.id,
      sizeGrams: selected.size_grams,
      sizeLabel: selected.size_label,
    }, quantity)
    setAdded(true)
  }

  if (!variants.length) return null

  return <div className="variant-picker">
    <label><span style={{fontWeight:700}}>Choose size</span><select value={selectedId} onChange={e => { setSelectedId(e.target.value); setAdded(false) }}>{variants.map(v => <option key={v.id} value={v.id} disabled={v.stock_quantity <= 0}>{v.size_label}{v.stock_quantity <= 0 ? ' · Out of stock' : ''} — ₦{Number(v.price).toLocaleString('en-NG')}</option>)}</select></label>
    <label><span style={{fontWeight:700}}>Quantity</span><input type="number" min={1} max={Math.max(1, Math.min(selected?.stock_quantity ?? 1, 100))} value={quantity} onChange={e => { setQuantity(Math.max(1, Math.min(Number(e.target.value) || 1, 100))); setAdded(false) }} /></label>
    {added?<Link className="btn btn-primary" href="/checkout">Proceed to checkout</Link>:<button className="btn btn-primary" onClick={add} disabled={!selected || selected.stock_quantity < quantity}>{selected?.stock_quantity ? 'Add to cart' : 'Out of stock'}</button>}
  </div>
}
