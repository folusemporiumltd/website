import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import AdminBreadcrumbs from '@/components/admin-breadcrumbs'

async function requireAdmin(){const s=await createClient();const {data:a}=await s.auth.getUser();if(!a.user)redirect('/login?next=/admin/users&mode=signin');const {data:isAdmin,error}=await s.rpc('get_my_admin_status');if(error||isAdmin!==true)redirect('/account?admin_error=access');return {s,user:a.user}}

async function changeRole(formData:FormData){
  'use server'
  const {s}=await requireAdmin()
  const id=String(formData.get('id')||''),role=String(formData.get('role')||'')
  if(!id||!['admin','customer'].includes(role))return
  const {error}=await s.rpc('set_user_role',{p_user_id:id,p_role:role})
  if(error) redirect(`/admin/users?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/users');revalidatePath('/admin/dashboard')
  redirect('/admin/users?updated=1')
}

export default async function AdminUsersPage({searchParams}:{searchParams:Promise<{updated?:string,error?:string}>}){
  const params=await searchParams
  const {s,user}=await requireAdmin()
  const {data:profiles,error}=await s.rpc('list_admin_manageable_users')
  const admins=profiles?.filter((p:any)=>p.role==='admin').length??0
  const customers=profiles?.filter((p:any)=>p.role!=='admin').length??0
  return <main><div className="topbar"><div className="container"><span>Folus Emporium Administration</span><span>Roles & access</span></div></div><header className="nav"><div className="container nav-inner"><Link className="brand" href="/admin/dashboard"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>Admin Role Manager</small></span></Link><nav className="navlinks"><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin">Store Manager</Link><Link href="/admin/coupons">Coupons</Link><Link href="/">Storefront</Link></nav></div></header><section className="section"><div className="container" style={{maxWidth:1050}}><AdminBreadcrumbs items={[{label:'Admin',href:'/admin/dashboard'},{label:'Roles & Access'}]}/><div className="eyebrow">Access control</div><h1>Manage registered accounts</h1><p className="muted">View every registered Folus Emporium account and assign either Administrator or Customer access. Your own signed-in administrator account is protected from self-demotion.</p>
  <div style={{display:'flex',gap:12,flexWrap:'wrap',margin:'22px 0'}}><div style={{background:'#fff',border:'1px solid var(--line)',borderRadius:14,padding:'14px 18px'}}><strong>{profiles?.length??0}</strong><div className="muted">Registered accounts</div></div><div style={{background:'#fff',border:'1px solid var(--line)',borderRadius:14,padding:'14px 18px'}}><strong>{admins}</strong><div className="muted">Administrators</div></div><div style={{background:'#fff',border:'1px solid var(--line)',borderRadius:14,padding:'14px 18px'}}><strong>{customers}</strong><div className="muted">Customers</div></div></div>
  {params.updated?<p style={{padding:12,borderRadius:10,background:'#f2f8f2'}}>Account role updated successfully.</p>:null}{params.error?<p style={{padding:12,borderRadius:10,background:'#fff1f1'}}>Could not update role: {params.error}</p>:null}{error?<p className="muted">Registered accounts could not be loaded.</p>:null}
  <div style={{display:'grid',gap:12,marginTop:24}}>{profiles?.map((p:any)=><article key={p.id} style={{background:'#fff',border:'1px solid var(--line)',borderRadius:16,padding:18,display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap'}}><div><strong>{p.full_name||'Registered user'}{p.id===user.id?' (You)':''}</strong><div className="muted" style={{marginTop:4}}>{p.email||'No email'}{p.phone?` · ${p.phone}`:''}</div><div style={{marginTop:7}}>Current access: <b>{p.role==='admin'?'Administrator':'Customer'}</b></div></div><form action={changeRole} style={{display:'flex',gap:8,alignItems:'end',flexWrap:'wrap'}}><input type="hidden" name="id" value={p.id}/><label>Access level<select name="role" defaultValue={p.role||'customer'} disabled={p.id===user.id}><option value="customer">Customer</option><option value="admin">Administrator</option></select></label><button className="btn btn-primary" disabled={p.id===user.id}>{p.id===user.id?'Current admin':'Save access'}</button></form></article>)}</div>{profiles?.length===0&&!error?<div className="empty" style={{marginTop:24}}><h3>No registered accounts found</h3><p>Accounts will appear here after customers register on the website.</p></div>:null}</div></section></main>
}
