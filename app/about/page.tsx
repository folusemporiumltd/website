import type { Metadata } from 'next'
import Link from 'next/link'
import { createCatalogueClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const metadata: Metadata = {title:'About Us | Folus Emporium',description:'Learn about Folus Emporium, our purpose, values and story.'}

function paras(text?:string|null){
  return String(text||'')
    .replace(/\\n/g,'\n')
    .split(/\n\s*\n/)
    .map(p=>p.trim())
    .filter(Boolean)
    .map((p,i)=><p key={i}>{p}</p>)
}

const fallbackAbout={eyebrow:'About Folus Emporium',title:'Thoughtfully curated food products for everyday living.',intro:'Folus Emporium Ltd is a growing Nigerian food and lifestyle business focused on making quality food products more convenient, dependable and accessible to households and businesses.',content:'We work across sourcing, processing, packaging and distribution to serve customers who want dependable food products without unnecessary complexity. Our customers include households, supermarkets, restaurants, food vendors, schools, hotels and corporate organisations.',secondary_title:'Our mission and vision',secondary_content:'Mission: To source, process, package and distribute quality food products that support convenient everyday cooking and better customer experiences.\n\nVision: To grow into a recognised food business known for quality, reliable processing, practical innovation and strong relationships across the value chain.'}
const fallbackStory={eyebrow:'Our Story',title:'A growing business shaped by real customer needs.',intro:'Folus Emporium began with a simple idea: make useful, well-presented food and household products easier for people to access.',content:'As customer needs became clearer, the business developed a stronger focus on food sourcing, processing, packaging and distribution. Today, Folus Emporium is building a catalogue of practical products and investing in better systems, stronger supplier relationships, improved packaging and digital commerce.',secondary_title:'Where we are going',secondary_content:'The long-term goal is not simply to sell products. It is to build a trusted brand customers can rely on for quality, convenience and thoughtful service.'}

export default async function AboutPage(){
  const s=await createCatalogueClient()
  const {data:rows}=await s.from('company_pages').select('*').in('page_key',['about','story']).eq('is_published',true)
  const about=rows?.find((r:any)=>r.page_key==='about')||fallbackAbout
  const story=rows?.find((r:any)=>r.page_key==='story')||fallbackStory
  return <main><header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Curating Excellence for Life’s Finest Moments.</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/blog">Blog</Link><Link href="/contact">Contact Us</Link></nav></div></header><section className="content-hero"><div className="container content-hero-grid"><div><div className="eyebrow">{about.eyebrow||'About Folus Emporium'}</div><h1>{about.title}</h1>{paras(about.intro)}<div className="hero-actions"><Link className="btn btn-primary" href="/shop">Shop our products</Link><Link className="btn btn-outline" href="#story">Read our story</Link></div></div><div className="content-brand-card"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium circular logo"/><strong>Curating Excellence for Life’s Finest Moments.</strong><p>Quality products. Thoughtful processing. Dependable service.</p></div></div></section><section className="section"><div className="container"><div className="section-head"><div><div className="eyebrow">Who we are</div><h2>Serving everyday food needs with care.</h2></div></div><div className="content-two-col"><div className="story-panel">{paras(about.content)}</div><div className="content-stat-card"><span>{about.secondary_title||'Our mission and vision'}</span>{paras(about.secondary_content)}</div></div></div></section><section className="section soft-section" id="story"><div className="container"><div className="section-head"><div><div className="eyebrow">{story.eyebrow||'Our Story'}</div><h2>{story.title}</h2></div></div><div className="story-panel">{paras(story.intro)}{paras(story.content)}{story.secondary_title?<h3>{story.secondary_title}</h3>:null}{paras(story.secondary_content)}</div></div></section><section className="cta"><div className="container"><div className="cta-box"><div><div className="eyebrow">Discover Folus Emporium</div><h2>Explore products built around everyday needs.</h2></div><Link className="btn btn-primary" href="/shop">Visit the Shop</Link></div></div></section></main>}
