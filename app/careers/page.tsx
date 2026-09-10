import type { Metadata } from 'next'
import Link from 'next/link'
import { createCatalogueClient } from '@/lib/supabase/server'

export const dynamic='force-dynamic'
export const revalidate=0
export const metadata: Metadata={title:'Careers | Folus Emporium',description:'Explore career opportunities and learn what it means to work with Folus Emporium.'}

const qualities=[
 ['Ownership','We value people who take responsibility, communicate clearly and follow work through to completion.'],
 ['Customer focus','Every role should contribute to a better experience for the people and businesses we serve.'],
 ['Continuous improvement','We are building systems as we grow, so curiosity, learning and practical problem-solving matter.'],
 ['Respect','We expect professionalism, reliability and respect in how we work with colleagues, suppliers, customers and partners.'],
]
const fallback={eyebrow:'Careers',title:'Grow with a business that is still being built.',intro:'Folus Emporium is developing its food, ecommerce, operations and customer-service capabilities. We value practical thinkers who are willing to learn, take ownership and help improve the way work gets done.',content:'We value ownership, customer focus, continuous improvement, professionalism and respect. Openings are advertised when positions become available.',secondary_title:'Current openings',secondary_content:'No publicly advertised vacancy at the moment. If you would like to be considered for future opportunities, send a concise CV and a short introduction explaining the area in which you can contribute.'}
function paras(text?:string|null){return String(text||'').replace(/\\n/g,'\n').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean).map((x,i)=><p key={i}>{x}</p>)}

export default async function CareersPage(){
 const s=await createCatalogueClient(); const {data}=await s.rpc('list_published_company_pages'); const c=(data||[]).find((r:any)=>r.page_key==='careers')||fallback;
 return <main>
  <header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/about">About Us</Link><Link href="/blog">Blog</Link></nav></div></header>
  <section className="content-hero"><div className="container content-hero-grid"><div><div className="eyebrow">{c.eyebrow||'Careers'}</div><h1>{c.title}</h1>{paras(c.intro)}<div className="hero-actions"><a className="btn btn-primary" href="mailto:info@folusemporium.com?subject=Career%20Interest%20-%20Folus%20Emporium">Send your CV</a><Link className="btn btn-outline" href="/about">Learn about us</Link></div></div><div className="content-brand-card"><span className="eyebrow">Working at Folus Emporium</span><strong>Small team. Real responsibility. Visible impact.</strong><p>As we grow, each team member has an opportunity to contribute ideas, strengthen systems and improve customer outcomes.</p></div></div></section>
  <section className="section"><div className="container"><div className="section-head"><div><div className="eyebrow">Our culture</div><h2>What we value in people</h2></div></div><div className="value-grid light-values">{qualities.map(([title,text])=><article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
  <section className="section soft-section"><div className="container"><div className="section-head"><div><div className="eyebrow">Opportunity areas</div><h2>Where our team continues to grow</h2></div><p>Openings are advertised when positions become available. These are the main functions we continue to develop as the business expands.</p></div><div className="content-cards"><article><span>Digital & Growth</span><h3>Content, social media and ecommerce</h3><p>Brand storytelling, social media, product merchandising, website management and digital customer acquisition.</p></article><article><span>Operations</span><h3>Administration, procurement and fulfilment</h3><p>Supplier coordination, inventory, order fulfilment, documentation, logistics and day-to-day business operations.</p></article><article><span>Customer Experience</span><h3>Sales and customer support</h3><p>Helping customers choose products, resolving enquiries, managing repeat relationships and supporting business accounts.</p></article></div></div></section>
  <section className="section"><div className="container"><div className="section-head"><div><div className="eyebrow">Current openings</div><h2>{c.secondary_title||'No publicly advertised vacancy at the moment.'}</h2></div></div><div className="story-panel">{paras(c.secondary_content)}<p>Please include your location, relevant experience, availability and the kind of role you are interested in. We will only contact candidates when there is a suitable opportunity.</p><a className="btn btn-primary" href="mailto:info@folusemporium.com?subject=Career%20Interest%20-%20Folus%20Emporium">Email your application</a></div></div></section>
  <section className="cta"><div className="container"><div className="cta-box"><div><div className="eyebrow">Know our business first</div><h2>Read the story behind Folus Emporium.</h2></div><Link className="btn btn-primary" href="/about#story">Our Story</Link></div></div></section>
 </main>
}
