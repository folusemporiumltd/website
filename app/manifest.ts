import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Folus Emporium',
    short_name: 'Folus Emporium',
    description: 'Quality foods, pantry essentials, and thoughtfully curated products from Folus Emporium.',
    icons: [
      { src: '/icon.png', sizes: 'any', type: 'image/png', purpose: 'any maskable' },
    ],
  }
}
