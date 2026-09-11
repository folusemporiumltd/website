'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function ContactIcon({type}:{type:'email'|'phone'|'whatsapp'|'address'}){
 const common={fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const}
 if(type==='email')return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>
 if(type==='phone')return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><path d="M6.8 3.8 9.3 7l-1.6 2.1c1.2 2.5 2.9 4.2 5.4 5.4l2.1-1.6 3.2 2.5-1.5 3.1c-.4.8-1.3 1.2-2.2 1-6.5-1.6-11.8-6.9-13.4-13.4-.2-.9.2-1.8 1-2.2l3.1-1.5Z"/></svg>
 if(type==='whatsapp')return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><path d="M20 11.6A8 8 0 0 1 8.2 18.7L4 20l1.3-4.1A8 8 0 1 1 20 11.6Z"/><path d="M9.2 8.2c.5 2.9 2.2 4.6 5.1 5.1"/></svg>
 return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><path d="M20 10c0 5.2-8 10.5-8 10.5S4 15.2 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.4"/></svg>
}

export default function StorefrontFooter(){
 const pathname=usePathname()
 if(pathname?.startsWith('/admin')||pathname?.startsWith('/api'))return null
 return <footer className="footer luxury-footer global-storefront-footer"><div className="container footer-links-grid">
  <div><h3>Company</h3><Link href="/about">About Us</Link><Link href="/about#story">Our Story</Link><Link href="/blog">Blog</Link><Link href="/careers">Careers</Link><Link href="/contact">Contact Us</Link></div>
  <div><h3>Shop</h3><Link href="/shop">All Products</Link><Link href="/shop">Categories</Link><Link href="/shop?featured=true">Best Sellers</Link><Link href="/shop?new=true">New Arrivals</Link></div>
  <div><h3>Customer Service</h3><Link href="/faq">FAQs</Link><Link href="/shipping-policy">Shipping Policy</Link><Link href="/return-policy">Return Policy</Link><Link href="/privacy-policy">Privacy Policy</Link><Link href="/terms-and-conditions">Terms & Conditions</Link></div>
  <div><h3>My Account</h3><Link href="/login">Login</Link><Link href="/login?mode=signup">Register</Link><Link href="/wishlist">Wishlist</Link><Link href="/account">Order Tracking</Link><Link href="/help">Help Desk</Link></div>
  <div className="footer-contact"><h3>Contact Information</h3><a href="mailto:folusemporium@gmail.com"><ContactIcon type="email"/>folusemporium@gmail.com</a><a href="mailto:info@folusemporium.com"><ContactIcon type="email"/>info@folusemporium.com</a><a href="tel:+2349168157255"><ContactIcon type="phone"/>+234 916 815 7255</a><a href="https://wa.me/2349168157255"><ContactIcon type="whatsapp"/>+234 916 815 7255</a><p><ContactIcon type="address"/>Alarere, Ibadan, Oyo State</p></div>
 </div><div className="container footer-social-row"><div><b>Follow Folus Emporium</b><div className="footer-socials"><a href="https://www.facebook.com/folusemporiumltd" target="_blank" rel="noreferrer" aria-label="Facebook">f</a><a href="https://www.tiktok.com/@folusemporium25" target="_blank" rel="noreferrer" aria-label="TikTok">♪</a></div></div><div className="footer-payment-logos" role="group" aria-label="Accepted payment methods" style={{display:'flex',alignItems:'center',flexWrap:'nowrap',gap:14,padding:'10px 12px',background:'#fffdf9',border:'1px solid #e2ad46',borderRadius:8,maxWidth:'100%',boxSizing:'border-box'}}><img src="/Paystack.png" alt="Paystack" width={116} height={28} style={{display:'block',width:116,height:28,objectFit:'cover',flexShrink:1,minWidth:0,mixBlendMode:'multiply'}}/><img src="/visa-and-mastercard-logo-26.png" alt="Visa and Mastercard" width={132} height={34} style={{display:'block',width:132,height:34,objectFit:'contain',flexShrink:1,minWidth:0,mixBlendMode:'multiply'}}/></div></div><div className="container copyright footer-bottom"><img src="https://boaaiskncrfmaismhqno.supabase.co/storage/v1/object/public/product-images/folus-emporium-horizontal-logo.png" alt="Folus Emporium"/><span>© 2026 Folus Emporium. All Rights Reserved. · Nature’s Goodness, Purely Yours.</span></div></footer>
}