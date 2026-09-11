'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import CartLink from '@/components/cart-link'

type Pair = [string, string]
type Slide = { title: string; text: string; cta: string; href: string; image: string }
type Config = { announcement?: string; utilityLinks?: Pair[]; social?: Record<string, string>; navigation?: Pair[]; slides?: Slide[] }

function Icon({ name }: { name: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (name === 'search') return <svg viewBox="0 0 24 24" {...common}><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>
  if (name === 'account') return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1-3.6 3.7-5.5 7.5-5.5s6.5 1.9 7.5 5.5"/></svg>
  if (name === 'help') return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 0 1 4.8 1c0 2-2.5 2.2-2.5 4"/><path d="M12 17h.01"/></svg>
  if (name === 'heart') return <svg viewBox="0 0 24 24" {...common}><path d="M20.7 8.7c0 5.2-8.7 10-8.7 10s-8.7-4.8-8.7-10C3.3 6 5.3 4 8 4c1.8 0 3.3.9 4 2.3C12.7 4.9 14.2 4 16 4c2.7 0 4.7 2 4.7 4.7Z"/></svg>
  if (name === 'chevron') return <svg viewBox="0 0 24 24" {...common}><path d="m8 10 4 4 4-4"/></svg>
  return <svg viewBox="0 0 24 24" {...common}><path d="M4 7h16l-1 12H5L4 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
}

function SocialIcon({ name }: { name: string }) {
  if (name === 'facebook') return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.6 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.5 1.6-1.5h1.7V3.7c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.2H7.8V13h2.7v8h3.1Z"/></svg>
  if (name === 'instagram') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.4" cy="6.8" r="1.1" fill="currentColor"/></svg>
  if (name === 'tiktok') return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.4 3c.3 2.1 1.5 3.5 3.6 3.8v3c-1.3 0-2.5-.4-3.6-1.1v6.7a5.1 5.1 0 1 1-4.3-5v3.1a2.1 2.1 0 1 0 1.2 1.9V3h3.1Z"/></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20 11.6A8 8 0 0 1 8.2 18.7L4 20l1.3-4.1A8 8 0 1 1 20 11.6Z"/><path fill="currentColor" d="M9.2 7.5c-.2-.4-.5-.4-.7-.4h-.6c-.2 0-.6.1-.8.5-.3.4-1 1-.7 2.5.2 1.5 1.5 2.9 2.8 3.9 1.3.9 2.4 1.2 2.8 1.2.3 0 1.1-.5 1.3-1 .2-.4.2-.9.1-1-.1-.1-.3-.2-.7-.4l-1.1-.5c-.2-.1-.4-.1-.6.1l-.4.5c-.1.2-.3.2-.5.1-.2-.1-.8-.3-1.5-1-.5-.5-.9-1.2-1-1.4-.1-.2 0-.4.1-.5l.3-.4c.1-.1.1-.3.2-.4.1-.2 0-.3 0-.4l-.5-1.2Z"/></svg>
}

export function TrustIcon({ name }: { name: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (name === 'leaf') return <svg viewBox="0 0 24 24" {...common}><path d="M20.5 3.5C12 3.8 6.2 6.1 4.1 11.1c-1.2 2.9.1 6.2 3 7.1 3.3 1 6.4-.8 7.6-3.8C16.2 10.9 15 8.5 20.5 3.5Z"/><path d="M4.5 20.5c2.4-4.2 5.4-7 9.6-9.6"/></svg>
  if (name === 'shield') return <svg viewBox="0 0 24 24" {...common}><path d="M12 3.5 19 6v5.1c0 4.5-2.8 7.7-7 9.4-4.2-1.7-7-4.9-7-9.4V6l7-2.5Z"/><path d="m8.8 12 2.1 2.1 4.5-4.5"/></svg>
  if (name === 'truck') return <svg viewBox="0 0 24 24" {...common}><path d="M3 6h11v10H3zM14 10h3.5l3 3v3H14z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/></svg>
  return <svg viewBox="0 0 24 24" {...common}><path d="M20 15a4 4 0 0 1-4 4H8l-4 3v-7a4 4 0 0 1-2-3.5v-4A4 4 0 0 1 6 3h10a4 4 0 0 1 4 4v8Z"/><path d="M7 10h10M7 14h6"/></svg>
}

const helpLinks:[string,string][]=[['Help Desk','/help'],['How to place an order','/help#orders'],['Payment options','/help#payments'],['Track an order','/help#tracking'],['Account & registration','/help#account'],['Wishlist','/help#wishlist'],['Coupons & discounts','/help#coupons'],['Returns & refunds','/help#returns'],['Delivery & fulfilment','/help#delivery'],['Contact support','/help#support']]

export function StorefrontHeader({ config, categories }: { config: Config; categories: { name: string; slug: string }[] }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const search = (event: FormEvent) => { event.preventDefault(); const params = new URLSearchParams(); if (query.trim()) params.set('search', query.trim()); if (category) params.set('category', category); window.location.assign('/shop' + (params.size ? '?' + params.toString() : '')) }
  const social = ['facebook','tiktok','whatsapp','instagram'].map(name=>[name,config.social?.[name]??''] as const).filter(([,url])=>Boolean(url))
  return <header className="storefront-header">
    <div className="utility-bar"><div className="container utility-inner"><span>{config.announcement}</span><div className="utility-right">{(config.utilityLinks??[]).map(([label,href])=><Link href={href} key={label}>{label}</Link>)}{social.map(([name,url])=><a className="social-link" href={url} target="_blank" rel="noreferrer" key={name} aria-label={name}><SocialIcon name={name}/></a>)}</div></div></div>
    <div className="header-main"><div className="container header-main-inner">
      <Link className="luxury-brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span><b>FOLUS<br/>EMPORIUM</b><small>Nature’s Goodness, Purely Yours</small></span></Link>
      <form className="catalogue-search" onSubmit={search}><select aria-label="Product category" value={category} onChange={e=>setCategory(e.target.value)}><option value="">All Categories</option>{categories.map(item=><option value={item.slug} key={item.slug}>{item.name}</option>)}</select><input aria-label="Search products" placeholder="Search products..." value={query} onChange={e=>setQuery(e.target.value)}/><button aria-label="Search products" type="submit"><Icon name="search"/></button></form>
      <div className="header-tools"><Link href="/account" aria-label="My account"><Icon name="account"/><span>Account</span></Link><div className="header-help-menu"><Link href="/help" aria-label="Help"><Icon name="help"/><span>Help</span></Link><div className="header-help-dropdown" role="menu" aria-label="Help categories">{helpLinks.map(([label,href])=><Link href={href} role="menuitem" key={label}>{label}</Link>)}</div></div><Link href="/wishlist" aria-label="Wishlist"><Icon name="heart"/><span>Wishlist</span></Link><CartLink/></div>
      <button className="mobile-menu-toggle" aria-label={mobileOpen?'Close menu':'Open menu'} aria-expanded={mobileOpen} aria-controls="primary-navigation" onClick={()=>setMobileOpen(v=>!v)}>{mobileOpen?'×':'☰'}</button>
    </div></div>
    <nav id="primary-navigation" className={'primary-navigation '+(mobileOpen?'open':'')}><div className="container">{(config.navigation??[]).map(([label,href])=>label==='Categories'?<div className="nav-category-dropdown" key={label}><Link className="nav-category-trigger" href="/shop" onClick={()=>setMobileOpen(false)} aria-haspopup="true">{label}<Icon name="chevron"/></Link><div className="nav-category-menu" role="menu" aria-label="Product categories"><Link href="/shop" role="menuitem" onClick={()=>setMobileOpen(false)}>All Products</Link>{categories.map(item=><Link href={`/shop?category=${item.slug}`} role="menuitem" onClick={()=>setMobileOpen(false)} key={item.slug}>{item.name}</Link>)}</div></div>:<Link href={href} onClick={()=>setMobileOpen(false)} key={label}>{label}</Link>)}</div></nav>
  </header>
}

export function HeroCarousel({ slides }: { slides: Slide[] }) { const [index,setIndex]=useState(0); if(!slides.length)return null; const slide=slides[index]; const move=(by:number)=>setIndex((index+by+slides.length)%slides.length); return <section className="luxury-hero"><div className="container"><div className="hero-carousel-card"><div className="hero-copy"><div className="eyebrow">Folus Emporium</div><h1>{slide.title}</h1><p>{slide.text}</p><Link className="btn btn-primary" href={slide.href}>{slide.cta}</Link></div><div className="hero-banner"><img src={slide.image} alt={slide.title}/></div><button className="hero-arrow previous" onClick={()=>move(-1)} aria-label="Previous slide">←</button><button className="hero-arrow next" onClick={()=>move(1)} aria-label="Next slide">→</button><div className="hero-dots">{slides.map((item,itemIndex)=><button onClick={()=>setIndex(itemIndex)} className={itemIndex===index?'active':''} aria-label={'Show slide '+(itemIndex+1)} key={item.title}/>)}</div></div></div></section> }
