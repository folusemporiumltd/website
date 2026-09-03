import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ShopPage() {
  const supabase = await createClient()
  const { data: products } = await supabase.from('products').select('id,name,slug,description,price,image_url,featured').eq('is_active', true).order('featured', { ascending: false }).order('created_at', { ascending: false })

  return <main><header><h1>Folus Emporium</h1><p>Curating Excellence for Life’s Finest Moments</p><nav><Link href="/">Home</Link> · <Link href="/account">My Account</Link></nav></header><section><h2>Shop</h2>{products?.length ? <div>{products.map((p) => <article key={p.id}><h3>{p.name}</h3>{p.image_url && <img src={p.image_url} alt={p.name} width={240} />}<p>{p.description}</p><strong>₦{Number(p.price).toLocaleString('en-NG')}</strong></article>)}</div> : <p>Our products are being prepared. Please check back soon.</p>}</section></main>
}
