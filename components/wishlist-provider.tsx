'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type WishlistItem = {
  id: string
  name: string
  slug: string
  price: number
  image_url?: string | null
  sizeLabel?: string
}

type WishlistContextValue = {
  items: WishlistItem[]
  count: number
  hasItem: (id: string) => boolean
  toggleItem: (item: WishlistItem) => void
  removeItem: (id: string) => void
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextValue | null>(null)
const STORAGE_KEY = 'folus-emporium-wishlist'

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) setItems(JSON.parse(saved))
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const value = useMemo(() => ({
    items,
    count: items.length,
    hasItem: (id: string) => items.some(item => item.id === id),
    toggleItem: (item: WishlistItem) => setItems(current => current.some(x => x.id === item.id) ? current.filter(x => x.id !== item.id) : [...current, item]),
    removeItem: (id: string) => setItems(current => current.filter(x => x.id !== id)),
    clearWishlist: () => setItems([]),
  }), [items])

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used inside WishlistProvider')
  return context
}
