import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const AGENT_INSTRUCTIONS = `You are Folus VA, the Virtual Assistant - Business Administration for Folus Emporium Ltd.
Your role is to support management with daily operations across customer service, sales support, accounting/financial support, administration, inventory and digital business administration.

Core responsibilities:
- Customer support: organise enquiries, complaints, order/payment/delivery follow-up, customer relationship notes, and escalate complex issues.
- Sales: leads/prospects follow-up, sales documentation, quotations/invoice preparation guidance, order summaries, customer records, and daily sales progress.
- Finance support: daily sales/expense record support, bookkeeping documentation, payment tracking, outstanding balances, financial reporting support. Never invent transactions or mark a payment as confirmed without database evidence.
- Administration: tasks, reminders, meetings, records, internal coordination, data entry and management reporting.
- Digital operations: product/catalogue support, customer feedback, spreadsheets/forms and online communication support.

Operating rules:
1. Use only the Folus Emporium business data supplied in BUSINESS DATA. Do not invent orders, customers, payments, stock, revenue or personal information.
2. Clearly distinguish facts from recommendations or drafts.
3. Never claim to have sent an email, changed an order, refunded money, changed a price, deleted data or contacted a customer unless the system explicitly confirms execution.
4. Sensitive actions (customer-facing sends, refunds, cancellations, payment-status changes, price changes, bulk campaigns, destructive changes, admin-role changes) require management approval.
5. Be concise, practical and management-focused. Use Nigerian Naira amounts when relevant.
6. If the data is insufficient, say exactly what is missing.
7. Protect customer/company confidentiality. Do not expose unnecessary personal data.
8. When drafting customer communication, use professional, warm Folus Emporium language.
9. When asked for a report, give a decision-ready summary: key figures, issues needing attention, and next actions.
10. Your KPIs are response quality, accuracy, timeliness, sales-support efficiency, professional communication and reliability.`

function extractText(response:any){
  if(typeof response?.output_text==='string'&&response.output_text.trim())return response.output_text.trim()
  const parts:string[]=[]
  for(const item of response?.output??[]){
    for(const content of item?.content??[]){
      if(typeof content?.text==='string')parts.push(content.text)
    }
  }
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
  const message=String(body.message||'').trim()
  let threadId=String(body.threadId||'').trim()
  if(!message)return NextResponse.json({error:'Please enter a request for Folus VA.'},{status:400})
  if(message.length>6000)return NextResponse.json({error:'Please shorten this request.'},{status:400})

  if(!threadId){
    const {data:thread,error}=await supabase.from('ai_agent_threads').insert({created_by:user.id,title:message.slice(0,80)}).select('id').single()
    if(error)return NextResponse.json({error:'Could not start the assistant conversation.'},{status:500})
    threadId=thread.id
  }else{
    const {data:thread}=await supabase.from('ai_agent_threads').select('id').eq('id',threadId).maybeSingle()
    if(!thread)return NextResponse.json({error:'This assistant conversation is not available.'},{status:404})
  }

  await supabase.from('ai_agent_messages').insert({thread_id:threadId,role:'user',content:message})

  const [ordersResult,customersResult,productsResult,variantsResult,analyticsResult,movementsResult,reportsResult]=await Promise.all([
    supabase.rpc('list_admin_orders'),
    supabase.rpc('list_admin_customer_profiles'),
    supabase.rpc('list_admin_catalogue_products'),
    supabase.rpc('list_admin_catalogue_variants'),
    supabase.rpc('get_admin_sales_analytics'),
    supabase.rpc('list_admin_stock_movements',{p_limit:20}),
    supabase.rpc('get_admin_management_reports',{p_from:new Date(Date.now()-30*86400000).toISOString(),p_to:new Date().toISOString()})
  ])

  const compactOrders=(ordersResult.data??[]).slice(0,40).map((o:any)=>({
    reference:o.payment_reference||o.id,
    customer:o.customer_name||o.email||'Customer',
    status:o.status,payment_status:o.payment_status,payment_method:o.payment_method,
    total:o.total,delivery_zone:o.delivery_zone,created_at:o.created_at,
    items:Array.isArray(o.items)?o.items.slice(0,8):[]
  }))
  const compactCustomers=(customersResult.data??[]).slice(0,60).map((c:any)=>({
    full_name:c.full_name,email:c.email,role:c.role,total_orders:c.total_orders,
    paid_orders:c.paid_orders,total_spend:c.total_spend,last_order_at:c.last_order_at
  }))
  const compactProducts=(productsResult.data??[]).map((p:any)=>({id:p.id,name:p.name,price:p.price,stock_quantity:p.stock_quantity,featured:p.featured,is_active:p.is_active,default_size_grams:p.default_size_grams}))
  const compactVariants=(variantsResult.data??[]).map((v:any)=>({product_id:v.product_id,size_label:v.size_label,price:v.price,stock_quantity:v.stock_quantity,reorder_threshold:v.reorder_threshold,is_active:v.is_active}))

  const businessData={
    generated_at:new Date().toISOString(),
    analytics:analyticsResult.data??{},
    management_report_last_30_days:reportsResult.data??{},
    recent_orders:compactOrders,
    customers:compactCustomers,
    products:compactProducts,
    variants:compactVariants,
    recent_stock_movements:movementsResult.data??[]
  }

  const {data:history}=await supabase.from('ai_agent_messages').select('role,content').eq('thread_id',threadId).order('created_at',{ascending:true}).limit(12)
  const historyText=(history??[]).map((m:any)=>`${m.role.toUpperCase()}: ${m.content}`).join('\n\n')

  const apiKey=process.env.OPENAI_API_KEY
  if(!apiKey){
    const reply='The Folus VA workspace and business-data tools are connected, but the AI model runtime is not yet authorised on the website. Add the server-side OPENAI_API_KEY environment variable in Vercel to activate natural-language reasoning. No customer or business data has been sent to an external model.'
    await Promise.all([
      supabase.from('ai_agent_messages').insert({thread_id:threadId,role:'assistant',content:reply}),
      supabase.from('ai_agent_activity').insert({actor_user_id:user.id,thread_id:threadId,event_type:'agent_configuration_required',summary:'Folus VA requested OpenAI API configuration.'})
    ])
    return NextResponse.json({reply,threadId,configurationRequired:true})
  }

  const aiResponse=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'},
    body:JSON.stringify({
      model:process.env.OPENAI_AGENT_MODEL||'gpt-5.6-luna',
      store:false,
      instructions:AGENT_INSTRUCTIONS,
      input:`CONVERSATION\n${historyText}\n\nCURRENT REQUEST\n${message}\n\nBUSINESS DATA\n${JSON.stringify(businessData)}`
    })
  })

  const result=await aiResponse.json()
  if(!aiResponse.ok){
    const detail=result?.error?.message||'AI model request failed.'
    await supabase.from('ai_agent_activity').insert({actor_user_id:user.id,thread_id:threadId,event_type:'agent_error',summary:'Folus VA model request failed.',metadata:{detail}})
    return NextResponse.json({error:`Folus VA could not complete the request: ${detail}`},{status:502})
  }

  const reply=extractText(result)||'I could not generate a useful response from the available business data.'
  await Promise.all([
    supabase.from('ai_agent_messages').insert({thread_id:threadId,role:'assistant',content:reply}),
    supabase.from('ai_agent_threads').update({updated_at:new Date().toISOString()}).eq('id',threadId),
    supabase.from('ai_agent_activity').insert({actor_user_id:user.id,thread_id:threadId,event_type:'agent_response',summary:'Folus VA completed an administrative request.',metadata:{model:process.env.OPENAI_AGENT_MODEL||'gpt-5.6-luna'}})
  ])

  return NextResponse.json({reply,threadId})
}
