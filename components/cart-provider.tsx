'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type CartItem = {
  id: string
  name: string
  slug: string
  price: number
  image_url?: string | null
  quantity: number
  variantId?: string
  sizeGrams?: number
  sizeLabel?: string
}

type CartContextValue = {
  items: CartItem[]
  count: number
  subtotal: number
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'folus-emporium-cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const clearCart = useCallback(() => setItems(current => current.length ? [] : current), [])
  const wholeQuantity = (value: number) => Math.max(1, Math.min(100, Math.floor(Number(value) || 1)))

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) setItems(parsed.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.slug === 'string' && Number.isFinite(Number(item.price)) && Number(item.price) >= 0).map(item => ({...item, price:Number(item.price), quantity:wholeQuantity(item.quantity)}))) }
    } catch {
      // Storage may be unavailable; the cart still works in memory.
    } finally { setLoaded(true) }
  }, [])

  useEffect(() => {
    if (loaded) { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {} }
  }, [items, loaded])

  const value = useMemo(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem: (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
      setItems(current => {
        const existing = current.find(x => x.id === item.id)
        if (existing) return current.map(x => x.id === item.id ? { ...x, quantity: wholeQuantity(x.quantity + wholeQuantity(quantity)) } : x)
        return [...current, { ...item, quantity: wholeQuantity(quantity) }]
      })
    },
    updateQuantity: (id: string, quantity: number) => {
      setItems(current => quantity <= 0 ? current.filter(x => x.id !== id) : current.map(x => x.id === id ? { ...x, quantity: wholeQuantity(quantity) } : x))
    },
    removeItem: (id: string) => setItems(current => current.filter(x => x.id !== id)),
    clearCart,
  }), [items, clearCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
