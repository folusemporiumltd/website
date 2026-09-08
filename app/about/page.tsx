import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us | Folus Emporium',
  description: 'Learn about Folus Emporium, our purpose, values, story and commitment to quality food products and thoughtful everyday living.',
}

const values = [
  ['Quality', 'We pay attention to sourcing, processing, packaging and presentation so every product reflects the standard we want customers to trust.'],
  ['Integrity', 'We aim to communicate clearly, price fairly and build long-term relationships with customers, suppliers and partners.'],
  ['Convenience', 'We create practical food products that help households and businesses save time without compromising everyday usefulness.'],
  ['Growth', 'We continue learning, improving our processes and expanding our range in response to real customer needs.'],
]

export default function AboutPage() {
  return <main>
    <header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/blog">Blog</Link><Link href="/contact">Contact Us</Link></nav></div></header>

    <section className="content-hero"><div className="container content-hero-grid"><div><div className="eyebrow">About Folus Emporium</div><h1>Thoughtfully curated food products for everyday living.</h1><p>Folus Emporium Ltd is a growing Nigerian food and lifestyle business focused on making quality food products more convenient, dependable and accessible to households and businesses.</p><div className="hero-actions"><Link className="btn btn-primary" href="/shop">Shop our products</Link><Link className="btn btn-outline" href="#story">Read our story</Link></div></div><div className="content-brand-card"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium circular logo"/><strong>Nature’s Goodness, Purely Yours.</strong><p>Better ingredients. Better processing. Better experience.</p></div></div></section>

    <section className="section"><div className="container"><div className="section-head"><div><div className="eyebrow">Who we are</div><h2>Built around quality, trust and convenience.</h2></div></div><div className="content-two-col"><div><p>We work across sourcing, processing, packaging and distribution to serve customers who want dependable food products without unnecessary complexity. Our collection includes flours, powders, pantry staples, mixes, tea and carefully selected food products designed for homes and businesses.</p><p>Our customers include households as well as supermarkets, restaurants, food vendors, schools, hotels and corporate organisations. As the business grows, our focus remains consistent: provide practical products, improve processing standards and create a customer experience that people can return to with confidence.</p></div><div className="content-stat-card"><span>Our focus</span><strong>Food quality + practical convenience</strong><p>From product selection to packaging and delivery, every part of the experience is designed to make everyday food choices easier.</p></div></div></div></section>

    <section className="section soft-section"><div className="container"><div className="section-head"><div><div className="eyebrow">Purpose</div><h2>Our mission and vision</h2></div></div><div className="content-cards"><article><span>Mission</span><h3>Make dependable food products easier to access.</h3><p>To source, process, package and distribute quality food products that support convenient everyday cooking and better customer experiences.</p></article><article><span>Vision</span><h3>Build a trusted Nigerian food brand with lasting impact.</h3><p>To grow into a recognised food business known for quality, reliable processing, practical innovation and strong relationships across the value chain.</p></article><article><span>Promise</span><h3>Better ingredients. Better processing. Better experience.</h3><p>We keep improving how our products are selected, prepared, packaged and delivered so customers can buy with greater confidence.</p></article></div></div></section>

    <section className="section" id="story"><div className="container"><div className="section-head"><div><div className="eyebrow">Our Story</div><h2>A growing business shaped by real customer needs.</h2></div></div><div className="story-panel"><p>Folus Emporium began with a simple idea: make useful, well-presented food and household products easier for people to access. As customer needs became clearer, the business developed a stronger focus on food sourcing, processing, packaging and distribution.</p><p>What started as a broad lifestyle business has continued to evolve into a more focused food brand. Today, Folus Emporium is building a catalogue of practical products such as Plantain Flour, Poundo Yam Flour, Beans Powder with Chili, Easy Fry Flour Mix, Powdered Pap, natural powders, pantry staples, Veg Mix, Okababa Tea and Fruity Zobo Mix.</p><p>Our journey is still in its early growth stage, and that is exactly why improvement matters so much to us. We are investing in better systems, stronger supplier relationships, improved packaging, digital commerce and a more dependable buying experience for both individual and business customers.</p><p>The long-term goal is not simply to sell products. It is to build a trusted brand customers can rely on for quality, convenience and thoughtful service.</p></div></div></section>

    <section className="section promise"><div className="container"><div className="section-head"><div><div className="eyebrow">What guides us</div><h2 style={{color:'#fff'}}>Our values</h2></div></div><div className="value-grid">{values.map(([title,text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

    <section className="cta"><div className="container"><div className="cta-box"><div><div className="eyebrow">Discover Folus Emporium</div><h2>Explore the products we are building around everyday needs.</h2></div><Link className="btn btn-primary" href="/shop">Visit the Shop</Link></div></div></section>
  </main>
}
