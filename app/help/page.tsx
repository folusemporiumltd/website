import Link from 'next/link'
import type { Metadata } from 'next'
import { createCatalogueClient } from '@/lib/supabase/server'
import { StorefrontHeader } from '@/components/storefront-ui'
import HelpDeskContent from '@/components/help-desk-content'

export const metadata:Metadata={title:'Help Desk',description:'Help and guidance for shopping, accounts, payments, delivery, order tracking, wishlist, coupons and support on Folus Emporium.'}

const fallback={announcement:'Serving homes & businesses across Nigeria.',utilityLinks:[['Track Order','/account'],['FAQ','/faq'],['Contact Us','/contact']] as [string,string][],social:{facebook:'https://www.facebook.com/folusemporiumltd',instagram:'',tiktok:'https://www.tiktok.com/@folusemporium25',youtube:'',linkedin:'',whatsapp:'https://wa.me/2349168157255'},navigation:[['Home','/'],['Shop','/shop'],['Categories','/shop'],['About Us','/about'],['Our Story','/about#story'],['Blog','/blog'],['Careers','/careers'],['Contact Us','/contact']] as [string,string][]}

export default async function HelpPage(){
 const supabase=await createCatalogueClient(); const [{data:storefrontContent},{data:categories}]=await Promise.all([supabase.from('storefront_content').select('config').eq('id',true).maybeSingle(),supabase.from('categories').select('name,slug').order('name')]); const config={...fallback,...((storefrontContent?.config??{}) as Partial<typeof fallback>)}
 return <main className="help-shell"><StorefrontHeader config={config} categories={categories??[]}/>
 <section className="help-hero"><div className="container"><div className="eyebrow">Folus Emporium Help Desk</div><h1>How can we help you?</h1><p>Choose a help category below, then open any question to see the answer.</p><div className="help-search"><input aria-label="Search help topics" placeholder="Use Ctrl + F / Find in page to search a question" readOnly/><Link className="btn btn-primary" href="#topics">Browse help topics</Link></div></div></section>
 <HelpDeskContent/>
 <footer className="footer luxury-footer"><div className="container footer-links-grid"><div><h3>Company</h3><Link href="/about">About Us</Link><Link href="/about#story">Our Story</Link><Link href="/contact">Contact Us</Link></div><div><h3>Shop</h3><Link href="/shop">All Products</Link><Link href="/wishlist">Wishlist</Link></div><div><h3>Customer Service</h3><Link href="/faq">FAQs</Link><Link href="/shipping-policy">Shipping Policy</Link><Link href="/return-policy">Return Policy</Link></div><div><h3>My Account</h3><Link href="/login">Login</Link><Link href="/login?mode=signup">Register</Link><Link href="/wishlist">Wishlist</Link><Link href="/account">Order Tracking</Link><Link href="/help">Help Desk</Link></div><div className="footer-contact"><h3>Need help?</h3><a href="mailto:folusemporium@gmail.com">folusemporium@gmail.com</a><a href="tel:+2349168157255">+234 916 815 7255</a><a href="https://wa.me/2349168157255">WhatsApp Support</a></div></div></footer>
 </main>
}
