'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type CartItem = {
  id: string
  name: string
  slug: string
  price: number
  image_url?: string | null
  quantity: number
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
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem: (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
      setItems(current => {
        const existing = current.find(x => x.id === item.id)
        if (existing) return current.map(x => x.id === item.id ? { ...x, quantity: x.quantity + quantity } : x)
        return [...current, { ...item, quantity }]
      })
    },
    updateQuantity: (id: string, quantity: number) => {
      setItems(current => quantity <= 0 ? current.filter(x => x.id !== id) : current.map(x => x.id === id ? { ...x, quantity } : x))
    },
    removeItem: (id: string) => setItems(current => current.filter(x => x.id !== id)),
    clearCart: () => setItems([]),
  }), [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
