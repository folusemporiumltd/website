'use client'

import { useWishlist } from './wishlist-provider'

type Product = { id: string; name: string; slug: string; price: number; image_url?: string | null }
type Variant = { size_label: string; price: number }

export default function WishlistButton({ product, variant }: { product: Product; variant?: Variant | null }) {
  const { hasItem, toggleItem } = useWishlist()
  const active = hasItem(product.id)
  const price = variant && Number(variant.price) > 0 ? Number(variant.price) : Number(product.price)

  return (
    <button
      type="button"
      className={`wishlist-button ${active ? 'active' : ''}`}
      aria-label={active ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      aria-pressed={active}
      title={active ? 'Remove from wishlist' : 'Add to wishlist'}
      onClick={() => toggleItem({ id: product.id, name: product.name, slug: product.slug, price, image_url: product.image_url, sizeLabel: variant?.size_label })}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5.2-8.8 10-8.8 10s-8.8-4.8-8.8-10C3.2 6 5.3 4 8 4c1.8 0 3.3.9 4 2.3C12.7 4.9 14.2 4 16 4c2.7 0 4.8 2 4.8 4.8Z"/></svg>
    </button>
  )
}
