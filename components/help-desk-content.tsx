'use client'

import Link from 'next/link'
import { useState } from 'react'

type Topic={id:string;title:string;description:string;icon:string;questions:{q:string;a:React.ReactNode}[]}

const topics:Topic[]=[
{id:'account',title:'Account & Registration',description:'Create an account, sign in, manage your profile and password.',icon:'👤',questions:[
{q:'Do I need an account to browse the shop?',a:<>No. You can browse products and categories without signing in. You will be asked to sign in or register when you proceed from your cart to checkout.</>},
{q:'How do I create an account?',a:<>Select <strong>Account</strong> in the header, choose Create Account, enter your details and complete email confirmation if requested.</>},
{q:'Where can I manage my account?',a:<>Open <Link href="/account">My Account</Link> to view your profile, orders, newsletter preference and password settings.</>}]},
{id:'orders',title:'Shopping & Orders',description:'Find products, choose package sizes, add to cart and place an order.',icon:'🛒',questions:[
{q:'How do I place an order?',a:<><ol><li>Open <Link href="/shop">Shop</Link>.</li><li>Search or browse by category.</li><li>Open a product and select the required package size and quantity.</li><li>Add it to your cart.</li><li>Review your cart and proceed to checkout.</li><li>Sign in or register, confirm delivery details and choose a payment method.</li></ol></>},
{q:'Can I continue shopping after adding items to my cart?',a:<>Yes. Your cart remains available while you continue browsing the store.</>}]},
{id:'payments',title:'Payments',description:'Understand Paystack online payment and Pay After Delivery.',icon:'💳',questions:[
{q:'What payment methods are available?',a:<>Folus Emporium supports secure online payment through Paystack and may offer Pay After Delivery for eligible orders.</>},
{q:'What should I do if Paystack payment is interrupted?',a:<>Check <Link href="/account">My Account</Link> first to confirm the order and payment status before creating another order. If the issue remains, contact support.</>}]},
{id:'tracking',title:'Order Tracking',description:'Follow your order from Pending to Processing, Shipped and Delivered.',icon:'📦',questions:[
{q:'How do I track my order?',a:<>Sign in, open <Link href="/account">My Account</Link>, locate the order and review its status, payment status, items, total, delivery information and dates.</>},
{q:'What do the order statuses mean?',a:<><strong>Pending</strong> means received, <strong>Processing</strong> means being prepared, <strong>Shipped</strong> means dispatched, and <strong>Delivered</strong> means fulfilled. Cancelled orders are shown separately.</>}]},
{id:'delivery',title:'Delivery & Fulfilment',description:'Learn about delivery details, shipping progress and fulfilment.',icon:'🚚',questions:[
{q:'How is delivery handled?',a:<>Delivery availability and charges depend on the information selected during checkout. Keep your phone number and delivery address accurate.</>},
{q:'What should I provide when asking about a delivery?',a:<>Provide your order reference so the Folus Emporium team can locate the order quickly.</>}]},
{id:'wishlist',title:'Wishlist',description:'Save products you like and return to them later.',icon:'♡',questions:[
{q:'How do I save a product to my wishlist?',a:<>Select the heart icon on a product. You can later open <Link href="/wishlist">Wishlist</Link> from the header to review saved products.</>},
{q:'Can I remove an item from my wishlist?',a:<>Yes. You can remove saved products at any time.</>}]},
{id:'coupons',title:'Coupons & Discounts',description:'Use valid coupon codes and understand discount conditions.',icon:'🏷️',questions:[
{q:'How do I use a coupon?',a:<>Enter a valid Folus Emporium coupon code during checkout before payment. If accepted, the discount will appear in your order total.</>},
{q:'Why might a coupon not work?',a:<>A coupon may be inactive, expired, over its usage limit, or subject to campaign conditions.</>}]},
{id:'returns',title:'Returns & Refunds',description:'Find guidance for returns, refunds and order issues.',icon:'↩️',questions:[
{q:'How do I request a return or refund?',a:<>Review the <Link href="/return-policy">Return Policy</Link>, then contact Folus Emporium with your order reference, product details and a clear description of the issue.</>},
{q:'Where can I see a refund status?',a:<>Your order information in My Account may show the payment status as refunded after a refund has been processed.</>}]},
{id:'newsletter',title:'Newsletter',description:'Manage product updates, offers and email preferences.',icon:'✉️',questions:[
{q:'How do I subscribe?',a:<>Use the newsletter form in the website footer or opt in during registration.</>},
{q:'How do I change my newsletter preference?',a:<>Registered customers can update their preference from <Link href="/account">My Account</Link>.</>}]},
{id:'support',title:'Contact Support',description:'Reach Folus Emporium when you need personal assistance.',icon:'🎧',questions:[
{q:'How can I contact Folus Emporium?',a:<div className="help-contact"><a className="btn btn-primary" href="https://wa.me/2349168157255">WhatsApp Support</a><a className="btn btn-outline" href="mailto:folusemporium@gmail.com">Email Support</a><Link className="btn btn-outline" href="/contact">Contact page</Link></div>},
{q:'What should I include for an order-related enquiry?',a:<>Include your order reference and a brief explanation of the issue so the support team can assist faster.</>}]}
]

export default function HelpDeskContent(){
 const [selected,setSelected]=useState<string|null>(null)
 const choose=(id:string)=>{setSelected(id);window.setTimeout(()=>document.getElementById(`faq-${id}`)?.scrollIntoView({behavior:'smooth',block:'start'}),50)}
 return <>
 <section className="container" id="topics"><div className="help-grid">{topics.map(t=><button type="button" className={'help-topic '+(selected===t.id?'active':'')} onClick={()=>choose(t.id)} key={t.id} aria-describedby={selected===t.id?`desc-${t.id}`:undefined}><span className="help-topic-icon" aria-hidden="true">{t.icon}</span><strong>{t.title}</strong>{selected===t.id?<span className="help-topic-tooltip" id={`desc-${t.id}`}>{t.description}</span>:null}</button>)}</div></section>
 <div className="container help-faq-wrap"><div className="help-faq-heading"><div className="eyebrow">Help Articles</div><h2>Frequently asked questions</h2><p>Select a question to view the answer.</p></div><div className="help-faq-list">{topics.map(t=><section className="help-faq-category" id={`faq-${t.id}`} key={t.id}><div className="help-faq-category-title"><span className="help-topic-icon" aria-hidden="true">{t.icon}</span><h3>{t.title}</h3></div>{t.questions.map(item=><details className="help-faq-item" key={item.q}><summary>{item.q}<span aria-hidden="true">+</span></summary><div className="help-faq-answer">{item.a}</div></details>)}</section>)}</div></div>
 </>
}
