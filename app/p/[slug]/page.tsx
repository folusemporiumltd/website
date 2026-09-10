import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createCatalogueClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CmsPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const s=await createCatalogueClient();const {data:p}=await s.from('content_pages').select('*').eq('slug',slug).eq('is_published',true).maybeSingle();if(!p)notFound();return <main><header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/about">About Us</Link><Link href="/blog">Blog</Link></nav></div></header><section className="content-hero"><div className="container"><div className="eyebrow">Folus Emporium</div><h1>{p.title}</h1>{p.excerpt?<p style={{maxWidth:780}}>{p.excerpt}</p>:null}</div></section><section className="section"><div className="container article-wrap">{p.featured_image_url?<img src={p.featured_image_url} alt={p.title} style={{width:'100%',maxHeight:520,objectFit:'cover',borderRadius:18,marginBottom:24}}/>:null}{String(p.content||'').replace(/\\n/g,'\n').split(/\n\s*\n/).filter(Boolean).map((x:string,i:number)=><p key={i}>{x}</p>)}</div></section></main>}
