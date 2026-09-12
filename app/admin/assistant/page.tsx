import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminBreadcrumbs from '@/components/admin-breadcrumbs'
import AssistantClient from './assistant-client'
import '../dashboard/dashboard.css'
import './assistant.css'

async function requireAdmin(){
  const supabase=await createClient()
  const {data:authData}=await supabase.auth.getUser()
  if(!authData.user)redirect('/login?next=/admin/assistant&mode=signin')
  const {data:isAdmin,error}=await supabase.rpc('get_my_admin_status')
  if(error||isAdmin!==true)redirect('/account?admin_error=access')
  return {supabase,user:authData.user}
}

export default async function AIVirtualAssistantPage(){
  const {supabase,user}=await requireAdmin()
  const [{count:openTasks},{count:pendingApprovals},{data:activity},{data:latestThread}]=await Promise.all([
    supabase.from('ai_agent_tasks').select('*',{count:'exact',head:true}).in('status',['open','in_progress']),
    supabase.from('ai_agent_approvals').select('*',{count:'exact',head:true}).eq('status','pending'),
    supabase.from('ai_agent_activity').select('id,summary,created_at').order('created_at',{ascending:false}).limit(8),
    supabase.from('ai_agent_threads').select('id,title,updated_at').eq('created_by',user.id).eq('status','open').order('updated_at',{ascending:false}).limit(1).maybeSingle()
  ])

  let initialMessages:Array<{role:'user'|'assistant';content:string}>=[]
  if(latestThread?.id){
    const {data:messageRows}=await supabase.from('ai_agent_messages').select('role,content').eq('thread_id',latestThread.id).order('created_at',{ascending:true}).limit(30)
    initialMessages=(messageRows??[]).filter((m:any)=>m.role==='user'||m.role==='assistant').map((m:any)=>({role:m.role as 'user'|'assistant',content:String(m.content||'')}))
  }

  return <main className="admin-dashboard-shell">
    <div className="topbar"><div className="container"><span>Folus Emporium Administration</span><span>AI Virtual Assistant</span></div></div>
    <header className="nav"><div className="container nav-inner"><Link className="brand" href="/admin/dashboard"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium logo"/><span>FOLUS<br/>EMPORIUM<small>AI Virtual Assistant</small></span></Link><nav className="navlinks"><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin/reports">Reports</Link><Link href="/admin/products">Products</Link><Link href="/admin/orders">Orders</Link><Link href="/admin/customers">Customers</Link></nav></div></header>
    <section className="section" style={{paddingTop:42}}><div className="container">
      <AdminBreadcrumbs items={[{label:'Admin',href:'/admin/dashboard'},{label:'AI Virtual Assistant'}]}/>
      <div className="section-head"><div><div className="eyebrow">Business Administration Agent</div><h1>Folus VA</h1><p className="muted">Administrative and operational support for customer service, sales, bookkeeping support, order coordination, inventory and daily business activities.</p></div><Link className="btn btn-outline" href="/admin/dashboard">Back to dashboard</Link></div>
      <AssistantClient initialMessages={initialMessages} initialThreadId={latestThread?.id??''} openTasks={openTasks??0} pendingApprovals={pendingApprovals??0} recentActivity={activity??[]}/>
      <p className="muted" style={{marginTop:18,fontSize:12}}>Signed in as {user.email}. Agent activity is restricted to authorised Folus Emporium administrators and logged for accountability.</p>
    </div></section>
  </main>
}
