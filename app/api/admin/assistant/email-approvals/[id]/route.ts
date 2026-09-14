import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendApprovedGmailEmail } from '@/lib/google-gmail'

export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const supabase=await createClient()
  const {data:authData}=await supabase.auth.getUser()
  const user=authData.user
  if(!user)return NextResponse.json({error:'Please sign in as an administrator.'},{status:401})
  const {data:isAdmin,error:adminError}=await supabase.rpc('get_my_admin_status')
  if(adminError||isAdmin!==true)return NextResponse.json({error:'Administrator access required.'},{status:403})

  const {id}=await params
  let body:any={}
  try{body=await request.json()}catch{return NextResponse.json({error:'Invalid request.'},{status:400})}
  const decision=String(body.decision||'')
  if(!['approve','reject'].includes(decision))return NextResponse.json({error:'Choose approve or reject.'},{status:400})

  const {data:approval,error}=await supabase.from('ai_agent_approvals').select('id,thread_id,action_type,title,payload,status').eq('id',id).maybeSingle()
  if(error||!approval)return NextResponse.json({error:'Approval request not found.'},{status:404})
  if(approval.action_type!=='gmail_send')return NextResponse.json({error:'This approval is not a Gmail send request.'},{status:400})
  if(approval.status!=='pending')return NextResponse.json({error:'This approval has already been processed.'},{status:409})

  const now=new Date().toISOString()
  if(decision==='reject'){
    const {error:rejectError}=await supabase.from('ai_agent_approvals').update({status:'rejected',approved_by:user.id,approved_at:now}).eq('id',id).eq('status','pending')
    if(rejectError)return NextResponse.json({error:'Could not reject this approval.'},{status:500})
    await supabase.from('ai_agent_activity').insert({actor_user_id:user.id,thread_id:approval.thread_id,event_type:'approval_rejected',summary:'Gmail send request rejected.',metadata:{approval_id:id}})
    return NextResponse.json({status:'rejected'})
  }

  const {data:locked,error:lockError}=await supabase.from('ai_agent_approvals').update({status:'approved',approved_by:user.id,approved_at:now}).eq('id',id).eq('status','pending').select('id,payload,thread_id').maybeSingle()
  if(lockError||!locked)return NextResponse.json({error:'This approval was already processed.'},{status:409})

  const payload:any=locked.payload||{}
  try{
    const sent=await sendApprovedGmailEmail({accountEmail:String(payload.account_email||''),to:String(payload.to||''),subject:String(payload.subject||''),body:String(payload.body||'')})
    await Promise.all([
      supabase.from('ai_agent_approvals').update({status:'executed',executed_at:new Date().toISOString(),payload:{...payload,gmail_message_id:sent.id,gmail_thread_id:sent.threadId}}).eq('id',id),
      supabase.from('ai_agent_activity').insert({actor_user_id:user.id,thread_id:locked.thread_id,event_type:'approved_action_executed',summary:`Approved Gmail email sent to ${sent.to}.`,metadata:{approval_id:id,account_email:sent.accountEmail,to:sent.to,gmail_message_id:sent.id}})
    ])
    return NextResponse.json({status:'executed',sent})
  }catch(error:any){
    const message=error instanceof Error?error.message:'Gmail send failed.'
    await Promise.all([
      supabase.from('ai_agent_approvals').update({status:'failed',payload:{...payload,execution_error:message}}).eq('id',id),
      supabase.from('ai_agent_activity').insert({actor_user_id:user.id,thread_id:locked.thread_id,event_type:'approved_action_failed',summary:'Approved Gmail send failed.',metadata:{approval_id:id,error:message}})
    ])
    return NextResponse.json({error:message,status:'failed'},{status:502})
  }
}
