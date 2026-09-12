import Link from 'next/link'
import {redirect} from 'next/navigation'
import {revalidatePath} from 'next/cache'
import {createClient} from '@/lib/supabase/server'

async function submitReview(formData:FormData){
  'use server'
  const orderId=String(formData.get('order_id')||'')
  const productId=String(formData.get('product_id')||'')
  const rating=Number(formData.get('rating'))
  const title=String(formData.get('title')||'').trim()
  const review=String(formData.get('review')||'').trim()
  const db=await createClient()
  const {data:{user}}=await db.auth.getUser()
  if(!user)redirect(`/login?next=${encodeURIComponent(`/review/${orderId}/${productId}`)}&mode=signin`)
  if(!Number.isInteger(rating)||rating<1||rating>5||review.length<10||review.length>2000||title.length>120){
    redirect(`/review/${orderId}/${productId}?error=invalid`)
  }
  const {error}=await db.rpc('submit_product_review',{p_order_id:orderId,p_product_id:productId,p_rating:rating,p_title:title||null,p_review:review})
  if(error)redirect(`/review/${orderId}/${productId}?error=${encodeURIComponent(error.message)}`)
  revalidatePath(`/shop`)
  redirect(`/review/${orderId}/${productId}?submitted=1`)
}

export default async function ReviewPage({params,searchParams}:{params:Promise<{orderId:string;productId:string}>;searchParams?:Promise<Record<string,string|string[]|undefined>>}){
  const {orderId,productId}=await params
  const query=searchParams?await searchParams:{}
  const db=await createClient()
  const {data:{user}}=await db.auth.getUser()
  if(!user)redirect(`/login?next=${encodeURIComponent(`/review/${orderId}/${productId}`)}&mode=signin`)
  const [{data:product},{data:existing}]=await Promise.all([
    db.from('products').select('id,name,slug,image_url').eq('id',productId).eq('is_active',true).maybeSingle(),
    db.from('product_reviews').select('rating,title,review,status').eq('order_id',orderId).eq('product_id',productId).eq('user_id',user.id).maybeSingle(),
  ])
  if(!product)return <main><section className="section"><div className="container empty"><h1>Product not found</h1><Link className="btn btn-primary" href="/account">Return to My Account</Link></div></section></main>
  const submitted=query.submitted==='1'
  const rawError=typeof query.error==='string'?query.error:''
  return <main><header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium"/><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link><nav className="navlinks"><Link href="/shop">Shop</Link><Link href="/account">My Account</Link></nav></div></header><section className="section"><div className="container" style={{maxWidth:720}}><div className="eyebrow">Verified purchase review</div><h1>Review {product.name}</h1><p className="muted">Tell us about your experience. Your review will be published after approval by Folus Emporium.</p>{submitted?<div style={{background:'#eef8f0',border:'1px solid #bddfc5',borderRadius:16,padding:22,marginTop:22}}><h2 style={{marginTop:0}}>Thank you for your review!</h2><p>It has been sent to the admin team for approval.</p><Link className="btn btn-primary" href={`/shop/${product.slug}`}>View product</Link></div>:<form action={submitReview} className="cart-summary" style={{position:'static',marginTop:24}}><input type="hidden" name="order_id" value={orderId}/><input type="hidden" name="product_id" value={productId}/>{rawError?<p role="alert" style={{color:'var(--burgundy)',fontWeight:700}}>{rawError==='invalid'?'Choose a rating and write at least 10 characters.':rawError}</p>:null}<label>Rating<select name="rating" required defaultValue={existing?.rating||5}><option value="5">★★★★★ — Excellent</option><option value="4">★★★★☆ — Very good</option><option value="3">★★★☆☆ — Good</option><option value="2">★★☆☆☆ — Fair</option><option value="1">★☆☆☆☆ — Poor</option></select></label><label>Review title <span className="muted">(optional)</span><input name="title" maxLength={120} defaultValue={existing?.title||''} placeholder="Summarize your experience"/></label><label>Your review<textarea name="review" required minLength={10} maxLength={2000} rows={7} defaultValue={existing?.review||''} placeholder="What did you like? How did you use the product?"/></label>{existing?<p className="muted">Current review status: <strong style={{textTransform:'capitalize'}}>{existing.status}</strong>. Saving will return it to pending approval.</p>:null}<button className="btn btn-primary" type="submit">Submit review</button></form>}</div></section></main>
}
