import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog | Folus Emporium',
  description: 'Food tips, product education, processing insights and practical kitchen ideas from Folus Emporium.',
}

const posts = [
  { category: 'Food Education', title: 'Why proper food processing matters', excerpt: 'Good processing is about more than appearance. It supports consistency, cleanliness, shelf stability and a better customer experience.', date: 'September 2026', href: '/blog#processing' },
  { category: 'Product Guide', title: 'Plantain Flour: simple ways to use it', excerpt: 'From swallow and porridge to pancakes and baking, plantain flour can be a versatile addition to the pantry.', date: 'September 2026', href: '/blog#plantain' },
  { category: 'Product Guide', title: 'Poundo Yam Flour is not Amala Flour', excerpt: 'Understand the difference, what Poundo Yam Flour is designed for, and how to get a smooth, satisfying result.', date: 'September 2026', href: '/blog#poundo' },
  { category: 'Kitchen Tips', title: 'How to store flours and powders properly', excerpt: 'Airtight containers, dry storage and clean scoops can help protect texture, flavour and product quality after opening.', date: 'September 2026', href: '/blog#storage' },
]

export default function BlogPage() {
  return <main>
    <header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link><nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/about">About Us</Link><Link href="/contact">Contact Us</Link></nav></div></header>

    <section className="content-hero"><div className="container"><div className="eyebrow">Folus Emporium Journal</div><h1>Useful food knowledge for everyday living.</h1><p style={{maxWidth:760}}>Our blog shares practical ideas about food products, storage, processing, preparation and the everyday choices that help homes and businesses get more value from what they buy.</p></div></section>

    <section className="section"><div className="container"><div className="blog-grid">{posts.map(post => <article className="blog-card" key={post.title}><span>{post.category}</span><h2>{post.title}</h2><p>{post.excerpt}</p><div className="blog-meta">{post.date}</div><a href={post.href}>Read article →</a></article>)}</div></div></section>

    <section className="section soft-section" id="processing"><div className="container article-wrap"><div className="eyebrow">Food Education</div><h2>Why proper food processing matters</h2><p>Food processing affects more than convenience. Careful handling, cleaning, drying, milling and packaging can influence product consistency, hygiene, storage behaviour and the final experience customers have in the kitchen.</p><p>At Folus Emporium, our goal is to keep improving these steps so products are practical to use, clearly presented and handled with care from sourcing through packaging.</p></div></section>

    <section className="section" id="plantain"><div className="container article-wrap"><div className="eyebrow">Product Guide</div><h2>Plantain Flour: simple ways to use it</h2><p>Plantain Flour can work well beyond the traditional swallow. Depending on your recipe, it may also be used in porridge-style meals, pancakes and selected baking applications.</p><p>For best results, start with the preparation method suited to the particular dish and adjust liquid gradually to achieve the texture you want.</p></div></section>

    <section className="section soft-section" id="poundo"><div className="container article-wrap"><div className="eyebrow">Product Guide</div><h2>Poundo Yam Flour is not Amala Flour</h2><p>Poundo Yam Flour is intended to produce a smooth pounded-yam style swallow. Amala flour is prepared differently and has a distinct colour, flavour and texture. The two products should not be treated as interchangeable.</p><p>When preparing Poundo Yam Flour, add the flour gradually to hot water while stirring continuously until the mixture becomes smooth, cohesive and reaches your preferred firmness.</p></div></section>

    <section className="section" id="storage"><div className="container article-wrap"><div className="eyebrow">Kitchen Tips</div><h2>How to store flours and powders properly</h2><p>Keep dry food products tightly sealed in a cool, dry place away from direct sunlight, steam and moisture. Always use a clean, dry scoop and close the package or storage container immediately after use.</p><p>Good storage habits help reduce exposure to humidity and contaminants and make it easier to preserve the product's intended quality after opening.</p></div></section>

    <section className="cta"><div className="container"><div className="cta-box"><div><div className="eyebrow">From the blog to the kitchen</div><h2>Explore the Folus Emporium product collection.</h2></div><Link className="btn btn-primary" href="/shop">Shop now</Link></div></div></section>
  </main>
}
