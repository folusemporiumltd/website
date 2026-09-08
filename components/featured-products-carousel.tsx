'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import ProductCardActions from './product-card-actions'

type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  image_url: string | null
  featured: boolean
}

type Variant = {
  id: string
  product_id: string
  size_grams: number
  size_label: string
  price: number
  stock_quantity: number
}

export default function FeaturedProductsCarousel({ products, variants }: { products: Product[]; variants: Variant[] }) {
  const trackRef = useRef<HTMLDivElement>(null)

  const defaultVariantByProduct = new Map<string, Variant>()
  for (const variant of variants) {
    const existing = defaultVariantByProduct.get(variant.product_id)
    if (!existing || Math.abs(variant.size_grams - 500) < Math.abs(existing.size_grams - 500)) defaultVariantByProduct.set(variant.product_id, variant)
  }

  function move(direction: 1 | -1) {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector<HTMLElement>('.carousel-product-card')
    const step = card ? card.offsetWidth + 18 : track.clientWidth
    const maxScroll = track.scrollWidth - track.clientWidth
    if (direction > 0 && track.scrollLeft >= maxScroll - 8) {
      track.scrollTo({ left: 0, behavior: 'smooth' })
      return
    }
    if (direction < 0 && track.scrollLeft <= 8) {
      track.scrollTo({ left: maxScroll, behavior: 'smooth' })
      return
    }
    track.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  useEffect(() => {
    if (products.length <= 1) return
    const timer = window.setInterval(() => move(1), 4000)
    return () => window.clearInterval(timer)
  }, [products.length])

  return (
    <div className="featured-carousel" aria-label="Featured products carousel">
      <div className="featured-carousel-track" ref={trackRef}>
        {products.map(product => {
          const variant = defaultVariantByProduct.get(product.id)
          return (
            <article className="product-card carousel-product-card" key={product.id}>
              <Link href={`/shop/${product.slug}`} aria-label={`View ${product.name}`}>
                <div className="product-image">{product.image_url ? <img src={product.image_url} alt={product.name}/> : <span>{product.name}</span>}</div>
              </Link>
              <div className="product-body">
                <span className="status">{product.featured ? 'Featured' : 'Folus collection'} · {variant?.size_label ?? '500g'}</span>
                <h3><Link href={`/shop/${product.slug}`}>{product.name}</Link></h3>
                <p>{product.description}</p>
                <strong>{variant && Number(variant.price) > 0 ? `₦${Number(variant.price).toLocaleString('en-NG')}` : Number(product.price) > 0 ? `₦${Number(product.price).toLocaleString('en-NG')}` : 'Price to be updated'}</strong>
                <ProductCardActions product={product} variant={variant}/>
              </div>
            </article>
          )
        })}
      </div>
      <div className="featured-carousel-controls" aria-label="Product slider controls">
        <button type="button" onClick={() => move(-1)} aria-label="Previous product">←</button>
        <button type="button" onClick={() => move(1)} aria-label="Next product">→</button>
      </div>
    </div>
  )
}
