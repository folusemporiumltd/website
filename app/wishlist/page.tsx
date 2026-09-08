import WishlistClient from '@/components/wishlist-client'

export default async function WishlistPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams
  return <WishlistClient product={product ?? ''} />
}
