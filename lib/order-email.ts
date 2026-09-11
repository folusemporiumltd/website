import { createAdminClient } from '@/lib/supabase/admin'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://website-smoky-kappa-22.vercel.app'

type OrderLike = {
  id:string
  email?:string|null
  customer_name?:string|null
  payment_reference?:string|null
  payment_method?:string|null
  payment_status?:string|null
  status?:string|null
  subtotal?:number|string|null
  delivery_fee?:number|string|null
  discount_amount?:number|string|null
  total?:number|string|null
  delivery_address?:string|null
  items?:Array<any>|null
}

function money(v:any){return `₦${Number(v??0).toLocaleString('en-NG')}`}
function esc(v:any){return String(v??'').replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]||c))}
function sender(){const value=process.env.TRANSACTIONAL_FROM_EMAIL || process.env.NEWSLETTER_FROM_EMAIL || '';return value && !/resend\.dev/i.test(value)?value:null}
function titleFor(eventKey:string){
  if(eventKey==='payment_confirmed') return 'Payment confirmed — Folus Emporium'
  if(eventKey==='pay_after_delivery_confirmed') return 'Order confirmed — Pay After Delivery'
  if(eventKey.startsWith('status_')) return `Order ${eventKey.slice(7).replaceAll('_',' ')} — Folus Emporium`
  return 'Order update — Folus Emporium'
}
function messageFor(eventKey:string){
  const s=eventKey.replace(/^status_/,'')
  const map:Record<string,string>={processing:'Your order is now being prepared.',shipped:'Your order has been shipped and is on the way.',delivered:'Your order has been delivered. Thank you for shopping with Folus Emporium.',cancelled:'Your order has been cancelled.',pending:'Your order is pending review.'}
  if(eventKey==='payment_confirmed') return 'We have received your payment successfully and your order is confirmed.'
  if(eventKey==='pay_after_delivery_confirmed') return 'Your Pay After Delivery order has been confirmed. Payment will be collected according to the selected delivery arrangement.'
  return map[s] || 'There is an update on your order.'
}
function html(order:OrderLike,eventKey:string){
  const items=(Array.isArray(order.items)?order.items:[]).map((i:any)=>`<tr><td style="padding:10px 0;border-top:1px solid #eadfd5"><b>${esc(i.product_name||'Product')}</b><br><span style="font-size:13px;color:#766b68">${esc(i.size_label||'')} · Qty ${esc(i.quantity||1)}</span></td><td style="padding:10px 0;border-top:1px solid #eadfd5;text-align:right">${money(i.line_total)}</td></tr>`).join('')
  const ref=order.payment_reference||`Order #${order.id.slice(0,8)}`
  return `<!doctype html><html><body style="margin:0;background:#faf7f2;font-family:Arial,sans-serif"><div style="max-width:640px;margin:0 auto;padding:30px 18px"><div style="background:#fff;border:1px solid #eadfd5;border-radius:18px;padding:30px"><div style="color:#6f1734;font-weight:800;font-size:20px;margin-bottom:18px">FOLUS EMPORIUM</div><h2 style="margin:0 0 12px;color:#241f1f">${esc(titleFor(eventKey).replace(' — Folus Emporium',''))}</h2><p style="font-size:16px;line-height:1.7;color:#332b2b">Hello ${esc(order.customer_name||'Customer')},</p><p style="font-size:16px;line-height:1.7;color:#332b2b">${esc(messageFor(eventKey))}</p><div style="background:#faf8f5;border-radius:12px;padding:16px;margin:20px 0"><b>${esc(ref)}</b><br><span style="font-size:13px;color:#766b68">Order status: ${esc(order.status||'pending')} · Payment: ${esc(order.payment_status||'pending')}</span></div>${items?`<table style="width:100%;border-collapse:collapse">${items}</table>`:''}<p style="font-size:16px;line-height:1.7;color:#332b2b"><b>Total: ${money(order.total)}</b></p>${order.delivery_address?`<p style="font-size:14px;line-height:1.6;color:#766b68">Delivery address: ${esc(order.delivery_address)}</p>`:''}<p style="margin-top:24px"><a href="${SITE_URL}/account" style="display:inline-block;background:#6f1734;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">View My Account</a></p><hr style="border:0;border-top:1px solid #eadfd5;margin:28px 0"><p style="font-size:12px;line-height:1.6;color:#766b68">This is a transactional email about your Folus Emporium order.</p></div></div></body></html>`
}

export async function loadOrderForEmail(orderId:string){
  const db=createAdminClient()
  const {data,error}=await db.from('orders').select('*').eq('id',orderId).single()
  if(error||!data) return null
  return data as OrderLike
}

export async function sendOrderEmail(order:OrderLike,eventKey:string){
  const db=createAdminClient()
  if(!order?.id||!order.email) return {ok:false,skipped:true,reason:'missing-recipient'}
  const {data:existing}=await db.from('order_email_log').select('status').eq('order_id',order.id).eq('event_key',eventKey).maybeSingle()
  if(existing?.status==='sent') return {ok:true,duplicate:true}

  const from=sender()
  const apiKey=process.env.RESEND_API_KEY
  if(!from||!apiKey){
    await db.from('order_email_log').upsert({order_id:order.id,event_key:eventKey,recipient_email:order.email,status:'skipped',error_message:!apiKey?'RESEND_API_KEY missing':'Verified transactional sender not configured',updated_at:new Date().toISOString()},{onConflict:'order_id,event_key'})
    return {ok:false,skipped:true,reason:'sender-not-ready'}
  }

  try{
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[order.email],subject:titleFor(eventKey),html:html(order,eventKey),tags:[{name:'order_id',value:order.id},{name:'event',value:eventKey}]})})
    const body=await response.json().catch(()=>({}))
    if(!response.ok){
      await db.from('order_email_log').upsert({order_id:order.id,event_key:eventKey,recipient_email:order.email,status:'failed',error_message:body?.message||'Resend rejected email',updated_at:new Date().toISOString()},{onConflict:'order_id,event_key'})
      return {ok:false,error:body?.message||'Email send failed'}
    }
    await db.from('order_email_log').upsert({order_id:order.id,event_key:eventKey,recipient_email:order.email,status:'sent',provider_email_id:body?.id||null,error_message:null,updated_at:new Date().toISOString()},{onConflict:'order_id,event_key'})
    return {ok:true,id:body?.id}
  }catch(error){
    await db.from('order_email_log').upsert({order_id:order.id,event_key:eventKey,recipient_email:order.email,status:'failed',error_message:error instanceof Error?error.message:'Email send failed',updated_at:new Date().toISOString()},{onConflict:'order_id,event_key'})
    return {ok:false,error:error instanceof Error?error.message:'Email send failed'}
  }
}
