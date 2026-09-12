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

type RelatedProduct = {name:string;slug:string;image_url?:string|null;price?:number|string|null}

function money(v:any){return `₦${Number(v??0).toLocaleString('en-NG')}`}
function esc(v:any){return String(v??'').replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]||c))}
function sender(){const value=process.env.TRANSACTIONAL_FROM_EMAIL || process.env.NEWSLETTER_FROM_EMAIL || '';return value && !/resend\.dev/i.test(value)?value:null}
function brevoSender(){
  const value=sender()
  if(!value)return null
  const match=value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  return match?{name:match[1]||'Folus Emporium',email:match[2]}:{name:'Folus Emporium',email:value}
}
function titleFor(eventKey:string){
  if(eventKey==='purchase_thank_you') return 'Thank you for patronizing Folus Emporium'
  if(eventKey==='payment_confirmed') return 'Payment confirmed — Folus Emporium'
  if(eventKey==='pay_after_delivery_confirmed') return 'Order confirmed — Pay After Delivery'
  if(eventKey.startsWith('status_')) return `Order ${eventKey.slice(7).replaceAll('_',' ')} — Folus Emporium`
  return 'Order update — Folus Emporium'
}
function messageFor(eventKey:string){
  const s=eventKey.replace(/^status_/,'')
  const map:Record<string,string>={processing:'Your order is now being prepared.',shipped:'Your order has been shipped and is on the way.',delivered:'Your order has been delivered. Thank you for shopping with Folus Emporium.',cancelled:'Your order has been cancelled.',pending:'Your order is pending review.'}
  if(eventKey==='payment_confirmed') return 'We have received your payment successfully and your order is confirmed.'
  if(eventKey==='purchase_thank_you') return 'Thank you for choosing Folus Emporium. We would love to hear what you think about the products in your order.'
  if(eventKey==='pay_after_delivery_confirmed') return 'Your Pay After Delivery order has been confirmed. Payment will be collected according to the selected delivery arrangement.'
  return map[s] || 'There is an update on your order.'
}
function html(order:OrderLike,eventKey:string,related:RelatedProduct[]=[]){
  const items=(Array.isArray(order.items)?order.items:[]).map((i:any)=>`<tr><td style="padding:10px 0;border-top:1px solid #eadfd5"><b>${esc(i.product_name||'Product')}</b><br><span style="font-size:13px;color:#766b68">${esc(i.size_label||'')} · Qty ${esc(i.quantity||1)}</span></td><td style="padding:10px 0;border-top:1px solid #eadfd5;text-align:right">${money(i.line_total)}</td></tr>`).join('')
  const ref=order.payment_reference||`Order #${order.id.slice(0,8)}`
  const reviewButtons=eventKey==='purchase_thank_you'?(Array.isArray(order.items)?order.items:[]).map((i:any)=>i.product_id?`<p style="margin:10px 0"><a href="${SITE_URL}/review/${encodeURIComponent(order.id)}/${encodeURIComponent(i.product_id)}" style="display:inline-block;background:#6f1734;color:#fff;text-decoration:none;padding:11px 17px;border-radius:999px;font-weight:700">Review ${esc(i.product_name||'this product')}</a></p>`:'').join(''):''
  const suggestions=eventKey==='purchase_thank_you'&&related.length?`<hr style="border:0;border-top:1px solid #eadfd5;margin:28px 0"><h3 style="color:#6f1734">You may also like</h3><table style="width:100%;border-collapse:collapse">${related.map(p=>`<tr><td style="padding:10px 0;border-top:1px solid #eadfd5"><a href="${SITE_URL}/shop/${encodeURIComponent(p.slug)}" style="color:#6f1734;font-weight:700;text-decoration:none">${esc(p.name)}</a></td><td style="padding:10px 0;border-top:1px solid #eadfd5;text-align:right">${Number(p.price)>0?money(p.price):''}</td></tr>`).join('')}</table>`:''
  return `<!doctype html><html><body style="margin:0;background:#faf7f2;font-family:Arial,sans-serif"><div style="max-width:640px;margin:0 auto;padding:30px 18px"><div style="background:#fff;border:1px solid #eadfd5;border-radius:18px;padding:30px"><div style="color:#6f1734;font-weight:800;font-size:20px;margin-bottom:18px">FOLUS EMPORIUM</div><h2 style="margin:0 0 12px;color:#241f1f">${esc(titleFor(eventKey).replace(' — Folus Emporium',''))}</h2><p style="font-size:16px;line-height:1.7;color:#332b2b">Hello ${esc(order.customer_name||'Customer')},</p><p style="font-size:16px;line-height:1.7;color:#332b2b">${esc(messageFor(eventKey))}</p><div style="background:#faf8f5;border-radius:12px;padding:16px;margin:20px 0"><b>${esc(ref)}</b><br><span style="font-size:13px;color:#766b68">Order status: ${esc(order.status||'pending')} · Payment: ${esc(order.payment_status||'pending')}</span></div>${items?`<table style="width:100%;border-collapse:collapse">${items}</table>`:''}<p style="font-size:16px;line-height:1.7;color:#332b2b"><b>Total: ${money(order.total)}</b></p>${order.delivery_address?`<p style="font-size:14px;line-height:1.6;color:#766b68">Delivery address: ${esc(order.delivery_address)}</p>`:''}${reviewButtons?`<div style="margin-top:24px"><h3 style="color:#6f1734">Share your experience</h3><p style="color:#766b68;line-height:1.6">Your review helps other customers shop with confidence. Reviews are checked before publication.</p>${reviewButtons}</div>`:''}${suggestions}<p style="margin-top:24px"><a href="${SITE_URL}/account" style="display:inline-block;border:1px solid #6f1734;color:#6f1734;text-decoration:none;padding:11px 17px;border-radius:999px;font-weight:700">View My Account</a></p><hr style="border:0;border-top:1px solid #eadfd5;margin:28px 0"><p style="font-size:12px;line-height:1.6;color:#766b68">This is a transactional email about your Folus Emporium order.</p></div></div></body></html>`
}

async function relatedProducts(order:OrderLike){
  const db=createAdminClient()
  const ids=(Array.isArray(order.items)?order.items:[]).map((i:any)=>String(i.product_id||'')).filter(Boolean)
  if(!ids.length)return []
  const {data:purchased}=await db.from('products').select('category_id').in('id',ids)
  const categoryIds=[...new Set((purchased||[]).map((p:any)=>p.category_id).filter(Boolean))]
  let query=db.from('products').select('name,slug,image_url,price').eq('is_active',true).not('id','in',`(${ids.join(',')})`).limit(3)
  if(categoryIds.length)query=query.in('category_id',categoryIds)
  const {data}=await query.order('featured',{ascending:false})
  return (data||[]) as RelatedProduct[]
}

export async function loadOrderForEmail(orderId:string){
  const db=createAdminClient()
  const [{data,error},{data:items}]=await Promise.all([
    db.from('orders').select('*').eq('id',orderId).single(),
    db.from('order_items').select('product_id,product_name,variant_id,size_label,size_grams,quantity,unit_price,line_total').eq('order_id',orderId),
  ])
  if(error||!data) return null
  return {...data,items:items||[]} as OrderLike
}

export async function sendOrderEmail(order:OrderLike,eventKey:string){
  const db=createAdminClient()
  if(!order?.id||!order.email) return {ok:false,skipped:true,reason:'missing-recipient'}
  const {data:existing}=await db.from('order_email_log').select('status').eq('order_id',order.id).eq('event_key',eventKey).maybeSingle()
  if(existing?.status==='sent') return {ok:true,duplicate:true}

  const from=sender()
  const brevoFrom=brevoSender()
  const brevoKey=process.env.BREVO_API_KEY
  const resendKey=process.env.RESEND_API_KEY
  const recommendations=eventKey==='purchase_thank_you'?await relatedProducts(order):[]
  if(!from||(!brevoKey&&!resendKey)){
    await db.from('order_email_log').upsert({order_id:order.id,event_key:eventKey,recipient_email:order.email,status:'skipped',error_message:(!brevoKey&&!resendKey)?'BREVO_API_KEY or RESEND_API_KEY missing':'Verified transactional sender not configured',updated_at:new Date().toISOString()},{onConflict:'order_id,event_key'})
    return {ok:false,skipped:true,reason:'sender-not-ready'}
  }

  try{
    const useBrevo=Boolean(brevoKey&&brevoFrom)
    const response=useBrevo
      ?await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':brevoKey!,'Content-Type':'application/json',accept:'application/json'},body:JSON.stringify({sender:brevoFrom,to:[{email:order.email,name:order.customer_name||undefined}],subject:titleFor(eventKey),htmlContent:html(order,eventKey,recommendations),tags:['orders',eventKey],headers:{'Idempotency-Key':`${order.id}-${eventKey}`}}),cache:'no-store'})
      :await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[order.email],subject:titleFor(eventKey),html:html(order,eventKey,recommendations),tags:[{name:'order_id',value:order.id},{name:'event',value:eventKey}]})})
    const body=await response.json().catch(()=>({}))
    if(!response.ok){
      await db.from('order_email_log').upsert({order_id:order.id,event_key:eventKey,recipient_email:order.email,status:'failed',error_message:body?.message||`${useBrevo?'Brevo':'Resend'} rejected email`,updated_at:new Date().toISOString()},{onConflict:'order_id,event_key'})
      return {ok:false,error:body?.message||'Email send failed'}
    }
    const providerId=body?.messageId||body?.id||null
    await db.from('order_email_log').upsert({order_id:order.id,event_key:eventKey,recipient_email:order.email,status:'sent',provider_email_id:providerId,error_message:null,updated_at:new Date().toISOString()},{onConflict:'order_id,event_key'})
    return {ok:true,id:providerId}
  }catch(error){
    await db.from('order_email_log').upsert({order_id:order.id,event_key:eventKey,recipient_email:order.email,status:'failed',error_message:error instanceof Error?error.message:'Email send failed',updated_at:new Date().toISOString()},{onConflict:'order_id,event_key'})
    return {ok:false,error:error instanceof Error?error.message:'Email send failed'}
  }
}
