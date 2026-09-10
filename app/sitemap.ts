import type { MetadataRoute } from 'next'
import { createCatalogueClient } from '@/lib/supabase/server'

const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://website-smoky-kappa-22.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createCatalogueClient()
  const { data } = await supabase.from('products').select('slug,updated_at').eq('is_active', true)
  const pages = ['', '/shop', '/about', '/blog', '/careers', '/contact', '/faq', '/shipping-policy', '/return-policy', '/privacy-policy', '/terms-and-conditions']

  return [
    ...pages.map((path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency: path === '/shop' ? ('daily' as const) : ('weekly' as const),
      priority: path === '' ? 1 : path === '/shop' ? 0.9 : 0.7,
    })),
    ...(data ?? []).map((product) => ({
      url: `${base}/shop/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
