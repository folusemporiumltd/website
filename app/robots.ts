import type { MetadataRoute } from 'next'
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:'/',disallow:['/admin/','/account/','/checkout/','/api/']},sitemap:'https://website-smoky-kappa-22.vercel.app/sitemap.xml'}}
