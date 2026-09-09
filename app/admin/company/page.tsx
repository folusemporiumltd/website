import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import AdminBreadcrumbs from '@/components/admin-breadcrumbs'

async function admin(){
  const s=await createClient()
  const {data:a}=await s.auth.getUser()
  if(!a.user) redirect('/login?next=/admin/company')
  const {data:ok}=await s.rpc('get_my_admin_status')
  if(ok!==true) redirect('/account')
  return s
}

const slugify=(v:string)=>v.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'page'
function fresh(){['/','/about','/blog','/careers','/admin/company'].forEach(path=>revalidatePath(path))}

async function uploadImage(s:any,file:File,slug:string){
  if(!file||file.size===0) return null
  if(file.size>5*1024*1024) throw new Error('Featured image must be 5MB or less')
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase()
  const path=`content/${slug}-${Date.now()}.${ext}`
  const {error}=await s.storage.from('product-images').upload(path,file,{upsert:true,contentType:file.type||undefined})
  if(error) throw error
  return s.storage.from('product-images').getPublicUrl(path).data.publicUrl
}

async function createContent(f:FormData){
  'use server'
  const s=await admin()
  const kind=String(f.get('content_type')||'page')
  const title=String(f.get('title')||'').trim()
  const content=String(f.get('content')||'').trim()
  if(!title||!content) redirect('/admin/company?error=missing')
  let slug=slugify(String(f.get('slug')||title))
  const table=kind==='blog'?'blog_posts':'content_pages'
  const {data:e}=await s.from(table).select('id').eq('slug',slug).maybeSingle()
  if(e) slug+=`-${Date.now()}`
  const file=f.get('featured_image') as File
  const featured_image_url=await uploadImage(s,file,slug)
  const published=f.get('publish')==='on'
  const result=kind==='blog'
    ? await s.from('blog_posts').insert({title,slug,category:String(f.get('category')||''),excerpt:String(f.get('excerpt')||''),content,featured_image_url,is_published:published,published_at:published?new Date().toISOString():null})
    : await s.from('content_pages').insert({title,slug,excerpt:String(f.get('excerpt')||''),content,featured_image_url,menu_location:String(f.get('menu_location')||'none'),is_published:published})
  if(result.error) redirect(`/admin/company?error=${encodeURIComponent(result.error.message)}`)
  fresh(); redirect('/admin/company?created=1')
}

async function manageContent(f:FormData){
  'use server'
  const s=await admin()
  const type=String(f.get('type')||'')
  const id=String(f.get('id')||'')
  const action=String(f.get('action')||'')
  const {error}=await s.rpc('admin_manage_content',{p_type:type,p_id:id,p_action:action})
  if(error) redirect(`/admin/company?error=${encodeURIComponent(error.message)}`)
  fresh(); redirect(`/admin/company?changed=${action}`)
}

async function editContent(f:FormData){
  'use server'
  const s=await admin()
  const type=String(f.get('type')||'')
  const id=String(f.get('id')||'')
  const slug=String(f.get('slug')||id)
  let image:string|null=null
  const file=f.get('featured_image') as File
  if((type==='blog'||type==='custom')&&file?.size) image=await uploadImage(s,file,slug)
  let payload:any={}
  if(type==='home') payload={section_name:String(f.get('title')||''),eyebrow:String(f.get('eyebrow')||''),title:String(f.get('heading')||''),content:String(f.get('content')||''),button_label:String(f.get('button_label')||''),button_url:String(f.get('button_url')||'')}
  else if(type==='blog') payload={title:String(f.get('title')||''),category:String(f.get('category')||''),excerpt:String(f.get('excerpt')||''),content:String(f.get('content')||''),...(image?{featured_image_url:image}:{})}
  else if(type==='custom') payload={title:String(f.get('title')||''),excerpt:String(f.get('excerpt')||''),content:String(f.get('content')||''),menu_location:String(f.get('menu_location')||'none'),...(image?{featured_image_url:image}:{})}
  else payload={title:String(f.get('title')||''),eyebrow:String(f.get('eyebrow')||''),intro:String(f.get('excerpt')||''),content:String(f.get('content')||''),secondary_title:String(f.get('secondary_title')||''),secondary_content:String(f.get('secondary_content')||'')}
  const {error}=await s.rpc('admin_update_content',{p_type:type,p_id:id,p_payload:payload})
  if(error) redirect(`/admin/company?error=${encodeURIComponent(error.message)}`)
  fresh(); redirect('/admin/company?edited=1')
}

const label=(k:string)=>k==='about'?'About Us':k==='story'?'Our Story':'Careers'
const url=(k:string)=>k==='about'?'/about':k==='story'?'/about#story':'/careers'

export default async function CMS({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const q=await searchParams
  const s=await admin()
  const [{data:pages,error:pagesError},{data:posts,error:postsError},{data:home,error:homeError},{data:custom,error:customError}]=await Promise.all([
    s.rpc('list_admin_company_pages'),s.rpc('list_admin_blog_posts'),s.rpc('list_admin_homepage_sections'),s.rpc('list_admin_content_pages')
  ])
  const loadError=pagesError||postsError||homeError||customError
  const rows=[
    ...(home||[]).map((x:any)=>({...x,type:'home',display:x.section_name,where:'Homepage',link:'/',key:x.section_key})),
    ...(pages||[]).map((x:any)=>({...x,type:'page',display:label(x.page_key),where:'Company',link:url(x.page_key),key:x.page_key})),
    ...(posts||[]).map((x:any)=>({...x,type:'blog',display:x.title,where:'Blog',link:`/blog#${x.slug}`,key:x.slug})),
    ...(custom||[]).map((x:any)=>({...x,type:'custom',display:x.title,where:`Page · ${x.menu_location}`,link:`/p/${x.slug}`,key:x.slug}))
  ]
  const editKey=q.edit||''
  return <main>
    <div className="topbar"><div className="container"><span>Folus Emporium Administration</span><span>Content Management System</span></div></div>
    <header className="nav"><div className="container nav-inner"><Link className="brand" href="/admin/dashboard"><img src="/folus-emporium-circular-logo.png" alt="logo"/><span>FOLUS<br/>EMPORIUM<small>Website CMS</small></span></Link><nav className="navlinks"><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin/products">Products</Link><Link href="/admin/orders">Orders</Link><Link href="/admin/storefront">Menus</Link><Link href="/">Website</Link></nav></div></header>
    <section className="section"><div className="container" style={{maxWidth:1240}}>
      <AdminBreadcrumbs items={[{label:'Admin',href:'/admin/dashboard'},{label:'Website CMS'}]}/>
      <div className="eyebrow">Website CMS</div><h1>Pages & Published Content</h1>
      <p className="muted">Create pages and posts, upload featured images, edit content, and publish or remove website content.</p>
      {q.error?<p style={{padding:12,background:'#fff4f2',border:'1px solid #f0c7be',borderRadius:10,color:'#8a2d1d'}}>Action failed: {q.error}</p>:null}
      {(q.created||q.changed||q.edited)?<p style={{padding:12,background:'#f2f8f2',borderRadius:10}}>Content updated successfully.</p>:null}
      {loadError?<p style={{padding:12,background:'#fff4f2',border:'1px solid #f0c7be',borderRadius:10,color:'#8a2d1d'}}>Some website content could not be loaded.</p>:null}

      <details open style={{background:'#fff',border:'1px solid var(--line)',borderRadius:16,padding:20,margin:'24px 0'}}>
        <summary style={{fontWeight:800,fontSize:19,color:'var(--burgundy)',cursor:'pointer'}}>＋ Create New Content</summary>
        <form action={createContent} style={{display:'grid',gap:12,marginTop:18}} encType="multipart/form-data">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><label>Content type<select name="content_type"><option value="page">New Page</option><option value="blog">Blog Post</option></select></label><label>Place page in menu<select name="menu_location"><option value="none">Do not add to menu</option><option value="main">Main Navigation</option><option value="company">Company</option><option value="customer_service">Customer Service</option><option value="footer">Footer</option></select></label></div>
          <label>Title<input name="title" required/></label><label>URL slug (optional)<input name="slug"/></label>
          <label>Featured image<input type="file" name="featured_image" accept="image/jpeg,image/png,image/webp,image/svg+xml"/></label>
          <label>Blog category<input name="category"/></label><label>Excerpt / introduction<textarea name="excerpt" rows={3}/></label><label>Content<textarea name="content" rows={10} required/></label>
          <div><label><input type="checkbox" name="publish"/> Publish immediately</label> <button className="btn btn-primary">Create New Content</button></div>
        </form>
      </details>

      <div className="section-head"><div><h2>All Content</h2><p className="muted">{rows.length} items · {rows.filter((r:any)=>r.is_published).length} published</p></div></div>
      <div style={{overflowX:'auto',background:'#fff',border:'1px solid var(--line)',borderRadius:16}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:980}}><thead><tr style={{textAlign:'left',background:'#fcfaf7'}}>{['Image','Title','Content type','Location','Status','Updated','Actions'].map(h=><th key={h} style={{padding:13,borderBottom:'1px solid var(--line)'}}>{h}</th>)}</tr></thead><tbody>{rows.map((r:any)=><tr key={`${r.type}-${r.id}`}>
        <td style={{padding:10,borderBottom:'1px solid var(--line)'}}>{r.featured_image_url?<img src={r.featured_image_url} alt="" style={{width:72,height:48,objectFit:'cover',borderRadius:8}}/>:<span className="muted">—</span>}</td>
        <td style={{padding:13,borderBottom:'1px solid var(--line)'}}><strong>{r.display}</strong></td><td style={{padding:13,borderBottom:'1px solid var(--line)'}}>{r.type==='home'?'Homepage section':r.type==='blog'?'Blog Post':r.type==='custom'?'Page':'Core Page'}</td><td style={{padding:13,borderBottom:'1px solid var(--line)'}}>{r.where}</td><td style={{padding:13,borderBottom:'1px solid var(--line)'}}>{r.is_published?'Published':'Draft'}</td><td style={{padding:13,borderBottom:'1px solid var(--line)'}}>{new Date(r.updated_at||r.created_at).toLocaleDateString('en-NG')}</td>
        <td style={{padding:13,borderBottom:'1px solid var(--line)'}}><details><summary className="btn btn-outline" style={{cursor:'pointer',listStyle:'none'}}>Manage ▾</summary><div style={{display:'grid',gap:7,paddingTop:8,minWidth:180}}><Link className="btn btn-outline" href={`/admin/company?edit=${r.type}-${r.id}#editor-${r.type}-${r.key}`}>Edit</Link><Link className="btn btn-outline" href={r.link} target="_blank">View ↗</Link><form action={manageContent}><input type="hidden" name="id" value={r.id}/><input type="hidden" name="type" value={r.type}/><button className={r.is_published?'btn btn-outline':'btn btn-primary'} name="action" value={r.is_published?'unpublish':'publish'}>{r.is_published?'Unpublish':'Publish'}</button><button className="btn btn-outline" name="action" value="delete" style={{marginLeft:5}}>Delete</button></form></div></details></td>
      </tr>)}</tbody></table></div>

      <section style={{marginTop:40}}><h2>Content Editors</h2>{rows.map((r:any)=>{
        const opened=editKey===`${r.type}-${r.id}`
        return <details open={opened} id={`editor-${r.type}-${r.key}`} key={`e-${r.type}-${r.id}`} style={{background:'#fff',border:'1px solid var(--line)',borderRadius:14,padding:17,marginBottom:10}}>
          <summary style={{fontWeight:700,cursor:'pointer'}}>{r.display} · {r.where}</summary>
          <form action={editContent} style={{display:'grid',gap:11,marginTop:14}} encType="multipart/form-data"><input type="hidden" name="id" value={r.id}/><input type="hidden" name="type" value={r.type}/><input type="hidden" name="slug" value={r.slug||r.key}/>
            {(r.type==='blog'||r.type==='custom')?<><label>Replace featured image<input type="file" name="featured_image" accept="image/jpeg,image/png,image/webp,image/svg+xml"/></label>{r.featured_image_url?<img src={r.featured_image_url} alt="Current featured image" style={{width:240,maxWidth:'100%',borderRadius:10}}/>:null}</>:null}
            <label>Title / section name<input name="title" defaultValue={r.type==='home'?r.section_name:r.title}/></label>
            {r.type==='home'?<><label>Eyebrow<input name="eyebrow" defaultValue={r.eyebrow||''}/></label><label>Display heading<input name="heading" defaultValue={r.title||''}/></label></>:null}
            {r.type==='page'?<label>Eyebrow<input name="eyebrow" defaultValue={r.eyebrow||''}/></label>:null}
            {r.type==='blog'?<label>Category<input name="category" defaultValue={r.category||''}/></label>:null}
            {r.type==='custom'?<label>Menu location<select name="menu_location" defaultValue={r.menu_location}><option value="none">No menu</option><option value="main">Main Navigation</option><option value="company">Company</option><option value="customer_service">Customer Service</option><option value="footer">Footer</option></select></label>:null}
            {r.type!=='home'?<label>Excerpt / introduction<textarea name="excerpt" rows={3} defaultValue={r.excerpt||r.intro||''}/></label>:null}
            <label>Content<textarea name="content" rows={8} defaultValue={r.content||''}/></label>
            {r.type==='page'?<><label>Secondary heading<input name="secondary_title" defaultValue={r.secondary_title||''}/></label><label>Secondary content<textarea name="secondary_content" rows={4} defaultValue={r.secondary_content||''}/></label></>:null}
            {r.type==='home'?<div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:10}}><label>Button label<input name="button_label" defaultValue={r.button_label||''}/></label><label>Button URL<input name="button_url" defaultValue={r.button_url||''}/></label></div>:null}
            <button className="btn btn-primary">Save Changes</button>
          </form>
        </details>
      })}</section>
    </div></section>
  </main>
}
