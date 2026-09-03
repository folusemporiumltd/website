import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Folus Emporium | Nature’s Goodness, Curated for You',
  description: 'Better ingredients. Better processing. Better experience.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
