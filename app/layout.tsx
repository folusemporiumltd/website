import type { Metadata } from 'next'
import './globals.css'
import './storefront-enhancements.css'
import './help/help.css'
import './shared-footer.css'
import { CartProvider } from '@/components/cart-provider'
import { WishlistProvider } from '@/components/wishlist-provider'
import FloatingWhatsApp from '@/components/floating-whatsapp'
import GoogleAnalytics from '@/components/google-analytics'
import FooterNewsletterSignup from '@/components/footer-newsletter-signup'
import StorefrontFooter from '@/components/storefront-footer'

const site='https://website-smoky-kappa-22.vercel.app'
const seoTitle="Folus Emporium | Nature's Goodness, Purely Yours"
const seoDescription='A growing Nigerian food and lifestyle business focused on making quality food products more convenient, dependable and accessible to households and businesses.'

export const metadata:Metadata={
  metadataBase:new URL(site),
  title:{default:seoTitle,template:'%s | Folus Emporium'},
  description:seoDescription,
  keywords:['Folus Emporium','Nigerian food products','plantain flour','poundo yam flour','beans powder','food processing Nigeria','pantry essentials'],
  alternates:{canonical:'/'},
  openGraph:{type:'website',url:site,siteName:'Folus Emporium',title:seoTitle,description:seoDescription,images:['/folus-emporium-circular-logo.png']},
  twitter:{card:'summary_large_image',title:seoTitle,description:seoDescription,images:['/folus-emporium-circular-logo.png']},
  robots:{index:true,follow:true},
  icons:{icon:[{url:'/icon.png',type:'image/png'}],shortcut:[{url:'/icon.png',type:'image/png'}],apple:[{url:'/apple-icon.png',type:'image/png'}]}
}

export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en-NG"><body><CartProvider><WishlistProvider>{children}<FooterNewsletterSignup/><StorefrontFooter/><FloatingWhatsApp/></WishlistProvider></CartProvider><GoogleAnalytics/></body></html>}
