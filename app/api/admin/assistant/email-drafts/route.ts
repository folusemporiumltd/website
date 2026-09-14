import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGmailSnapshot } from '@/lib/google-gmail'

function extractText(response:any){
  if(typeof response?.output_text==='string'&&response.output_text.trim())return response.output_text.trim()
  const parts:string[]=[]
  for(const item of response?.output??[]){for(const content of item?.content??[]){if(typeof content?.text==='string')parts.push(content.text)}}
  return parts.join('\n').trim()
}

export async function POST(request:Request){
  const supabase=await createClient()
  const {data:authData}=await supabase.auth.getUser()
  const user=authData.user
  if(!user)return NextResponse.json({error:'Please sign in as an administrator.'},{status:401})
  const {data:isAdmin,error:adminError}=await supabase.rpc('get_my_admin_status')
  if(adminError||isAdmin!==true)return NextResponse.json({error:'Administrator access required.'},{status:403})

  let body:any={}
  try{body=await request.json()}catch{return NextResponse.json({error:'Invalid request.'},{status:400})}
  const instruction=String(body.instruction||'').trim()
  const accountEmail=String(body.accountEmail||'').trim().toLowerCase()
  const threadId=String(body.threadId||'').trim()||null
  if(!instruction)return NextResponse.json({error:'Describe the email Folus VA should prepare.'},{status:400})
  if(!accountEmail)return NextResponse.json({error:'Choose the Gmail account that should send the email.'},{status:400})

  const gmail=await fetchGmailSnapshot().catch(()=>({connected:false,accounts:[],total_unread_count:0}))
  const account=(gmail.accounts||[]).find((a:any)=>String(a.email||'').toLowerCase()===accountEmail)
  if(!account?.connected)return NextResponse.json({error:'The selected Gmail account is not available.'},{status:400})

  const apiKey=process.env.OPENAI_API_KEY
  if(!apiKey)return NextResponse.json({error:'OPENAI_API_KEY is not configured.'},{status:500})

  const prompt=`Prepare one professional Folus Emporium business email from the instruction below. Use only facts supported by the supplied Gmail context and instruction. If a recipient can be identified from the instruction or a clearly matching recent message, use that email address. Otherwise leave the recipient as an empty string. Do not invent order numbers, payments, promises, dates or customer facts. Tone: warm, concise, professional.\n\nSENDER ACCOUNT: ${accountEmail}\n\nINSTRUCTION:\n${instruction}\n\nRECENT GMAIL CONTEXT:\n${JSON.stringify(account.recent_messages||[])}`

  const aiResponse=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
    body:JSON.stringify({
      model:process.env.OPENAI_AGENT_MODEL||'gpt-5.6-luna',
      store:false,
      input:prompt,
      text:{format:{type:'json_schema',name:'gmail_email_draft',strict:true,schema:{type:'object',additionalProperties:false,properties:{to:{type:'string'},subject:{type:'string'},body:{type:'string'}},required:['to','subject','body']}}}
    })
  })
  const result=await aiResponse.json()
  if(!aiResponse.ok)return NextResponse.json({error:result?.error?.message||'Folus VA could not prepare the email draft.'},{status:502})

  let draft:any
  try{draft=JSON.parse(extractText(result))}catch{return NextResponse.json({error:'Folus VA returned an invalid email draft.'},{status:502})}
  const to=String(draft?.to||'').trim()
  const subject=String(draft?.subject||'').trim()
  const emailBody=String(draft?.body||'').trim()
  if(!subject||!emailBody)return NextResponse.json({error:'Folus VA could not prepare a complete draft. Please make the instruction more specific.'},{status:400})
  if(!to)return NextResponse.json({error:'Folus VA prepared the message but could not identify the recipient. Include the recipient email address in your instruction.'},{status:400})
  if(!/^\S+@\S+\.\S+$/.test(to))return NextResponse.json({error:'Folus VA could not identify a valid recipient email address.'},{status:400})

  const {data:approval,error}=await supabase.from('ai_agent_approvals').insert({
    created_by:user.id,
    thread_id:threadId,
    action_type:'gmail_send',
    title:`Send email to ${to}`,
    payload:{account_email:accountEmail,to,subject,body:emailBody,instruction},
    status:'pending'
  }).select('id,title,payload,status,created_at').single()
  if(error)return NextResponse.json({error:'The email draft was prepared but could not be added to approvals.'},{status:500})

  await supabase.from('ai_agent_activity').insert({actor_user_id:user.id,thread_id:threadId,event_type:'approval_requested',summary:`Gmail send approval requested for ${to}.`,metadata:{approval_id:approval.id,account_email:accountEmail,to}})
  return NextResponse.json({approval})
}
