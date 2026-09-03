import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Folus Emporium',
  description: 'Curating Excellence for Life’s Finest Moments',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
