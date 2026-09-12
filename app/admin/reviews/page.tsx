import Link from 'next/link'
import {redirect} from 'next/navigation'
import {revalidatePath} from 'next/cache'
import {createClient} from '@/lib/supabase/server'
import AdminBreadcrumbs from '@/components/admin-breadcrumbs'

async function requireAdmin(){const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/login?next=/admin/reviews&mode=signin');const {data:ok}=await db.rpc('get_my_admin_status');if(ok!==true)redirect('/account?admin_error=access');return db}
async function moderate(formData:FormData){
  'use server'
  const db=await requireAdmin(),id=String(formData.get('id')||''),status=String(formData.get('status')||'')
  if(!id||!['approved','rejected'].includes(status))redirect('/admin/reviews?error=invalid')
  const {error}=await db.rpc('admin_moderate_product_review',{p_review_id:id,p_status:status,p_admin_note:null})
  if(error)redirect(`/admin/reviews?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/reviews');revalidatePath('/shop');redirect(`/admin/reviews?updated=${status}`)
}
function stars(n:number){return '★'.repeat(Math.max(0,Math.min(5,n)))+'☆'.repeat(Math.max(0,5-n))}
export default async function AdminReviewsPage({searchParams}:{searchParams?:Promise<Record<string,string|string[]|undefined>>}){
  const params=searchParams?await searchParams:{},db=await requireAdmin()
  const {data:reviews,error}=await db.rpc('list_admin_product_reviews')
  const message=typeof params.updated==='string'?params.updated:''
  return <main><div className="topbar"><div className="container"><span>Folus Emporium Administration</span><span>Product review moderation</span></div></div><header className="nav"><div className="container nav-inner"><Link className="brand" href="/admin/dashboard"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium"/><span>FOLUS<br/>EMPORIUM<small>Review Manager</small></span></Link><nav className="navlinks"><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin/orders">Orders</Link><Link href="/admin/products">Products</Link></nav></div></header><section className="section"><div className="container" style={{maxWidth:1080}}><AdminBreadcrumbs items={[{label:'Admin',href:'/admin/dashboard'},{label:'Product Reviews'}]}/><div className="eyebrow">Customer feedback</div><h1>Product Reviews</h1><p className="muted">Approve genuine, useful reviews before they appear on product pages, or reject reviews that should remain private.</p>{message?<div style={{padding:14,borderRadius:12,background:'#eef8f0',fontWeight:700}}>Review {message} successfully.</div>:null}{error?<div style={{padding:14,borderRadius:12,background:'#fff1f1',color:'var(--burgundy)'}}>Unable to load reviews: {error.message}</div>:null}<div style={{display:'grid',gap:14,marginTop:24}}>{reviews?.length?reviews.map((r:any)=><article key={r.id} style={{background:'#fff',border:'1px solid var(--line)',borderRadius:16,padding:20}}><div style={{display:'flex',justifyContent:'space-between',gap:18,flexWrap:'wrap'}}><div style={{flex:'1 1 620px'}}><div className="eyebrow">{r.product_name} · {r.status}</div><div aria-label={`${r.rating} out of 5 stars`} style={{color:'#c49324',fontSize:22,letterSpacing:2,margin:'8px 0'}}>{stars(Number(r.rating))}</div>{r.title?<h2 style={{fontSize:24,margin:'5px 0'}}>{r.title}</h2>:null}<p style={{lineHeight:1.7,whiteSpace:'pre-wrap'}}>{r.review}</p><p className="muted" style={{fontSize:13}}>By {r.customer_name||'Customer'} · {r.customer_email||'No email'} · Submitted {new Date(r.created_at).toLocaleString('en-NG')}</p></div><form action={moderate} style={{display:'flex',gap:8,alignItems:'start',flexWrap:'wrap'}}><input type="hidden" name="id" value={r.id}/><button className="btn btn-primary" name="status" value="approved">Approve</button><button className="btn btn-outline" name="status" value="rejected">Reject</button></form></div></article>):<div className="empty"><h3>No reviews yet</h3><p>Submitted customer reviews will appear here for approval.</p></div>}</div></div></section></main>
}
