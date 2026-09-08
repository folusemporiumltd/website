import type { Metadata } from 'next'
import './globals.css'
import './storefront-enhancements.css'
import { CartProvider } from '@/components/cart-provider'
import { WishlistProvider } from '@/components/wishlist-provider'
import FloatingWhatsApp from '@/components/floating-whatsapp'
import GoogleAnalytics from '@/components/google-analytics'

const site='https://website-smoky-kappa-22.vercel.app'
export const metadata:Metadata={metadataBase:new URL(site),title:{default:'Folus Emporium | Curating Excellence for Life’s Finest Moments',template:'%s | Folus Emporium'},description:'Shop quality Nigerian food products, flours, spices, pantry essentials and thoughtfully processed foods from Folus Emporium Ltd.',keywords:['Folus Emporium','Nigerian food products','plantain flour','poundo yam flour','beans powder','food processing Nigeria','pantry essentials'],alternates:{canonical:'/'},openGraph:{type:'website',url:site,siteName:'Folus Emporium',title:'Folus Emporium | Curating Excellence for Life’s Finest Moments',description:'Thoughtfully sourced, processed and packaged food products for homes and businesses in Nigeria.',images:['/folus-emporium-circular-logo.png']},twitter:{card:'summary_large_image',title:'Folus Emporium',description:'Quality food products and pantry essentials from Folus Emporium.',images:['/folus-emporium-circular-logo.png']},robots:{index:true,follow:true},icons:{icon:[{url:'/icon.png',type:'image/png'}],shortcut:[{url:'/icon.png',type:'image/png'}],apple:[{url:'/apple-icon.png',type:'image/png'}]}}
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en-NG"><body><CartProvider><WishlistProvider>{children}<FloatingWhatsApp/></WishlistProvider></CartProvider><GoogleAnalytics/></body></html>}
