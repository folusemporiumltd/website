import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/components/cart-provider'

export const metadata: Metadata = {
  title: 'Folus Emporium | Curating Excellence for Life’s Finest Moments',
  description: 'Quality foods, pantry essentials, home solutions and thoughtfully curated products from Folus Emporium.',
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png' }],
    shortcut: [{ url: '/icon.png', type: 'image/png' }],
    apple: [{ url: '/apple-icon.png', type: 'image/png' }],
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><CartProvider>{children}</CartProvider></body>
    </html>
  )
}
