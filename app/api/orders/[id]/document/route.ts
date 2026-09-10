import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type PdfLine={text:string;bold?:boolean;size?:number}
const esc=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[^\x20-\x7E]/g,'')
const money=(v:unknown)=>`NGN ${Number(v??0).toLocaleString('en-NG',{minimumFractionDigits:2,maximumFractionDigits:2})}`
function makePdf(lines:PdfLine[]){
 const pages:PdfLine[][]=[];for(let i=0;i<lines.length;i+=42)pages.push(lines.slice(i,i+42))
 const objects:string[]=[];const add=(s:string)=>{objects.push(s);return objects.length}
 const catalog=add('');const pagesId=add('');const regular=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');const bold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');const pageIds:number[]=[]
 for(const pageLines of pages){let y=790;const ops=['BT'];for(const line of pageLines){const size=line.size??10;ops.push(`/${line.bold?'F2':'F1'} ${size} Tf`,`1 0 0 1 54 ${y} Tm`,`(${esc(line.text)}) Tj`);y-=line.size&&line.size>=16?25:17}ops.push('ET');const stream=ops.join('\n');const content=add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);const page=add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${regular} 0 R /F2 ${bold} 0 R >> >> /Contents ${content} 0 R >>`);pageIds.push(page)}
 objects[catalog-1]=`<< /Type /Catalog /Pages ${pagesId} 0 R >>`;objects[pagesId-1]=`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`
 let pdf='%PDF-1.4\n';const offsets=[0];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${o}\nendobj\n`});const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let i=1;i<offsets.length;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;pdf+=`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;return Buffer.from(pdf)}

export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{
  const {id}=await params;const type=req.nextUrl.searchParams.get('type')==='receipt'?'receipt':'invoice'
  const session=await createClient();const {data:{user}}=await session.auth.getUser();if(!user)return NextResponse.json({error:'Sign in required'},{status:401})
  const {data:isAdmin}=await session.rpc('get_my_admin_status');const admin=createAdminClient();const {data:order,error}=await admin.from('orders').select('*').eq('id',id).maybeSingle();if(error||!order)return NextResponse.json({error:'Order not found'},{status:404});if(order.user_id!==user.id&&isAdmin!==true)return NextResponse.json({error:'Access denied'},{status:403});if(type==='receipt'&&order.payment_status!=='paid')return NextResponse.json({error:'Payment receipt is available only after payment is confirmed.'},{status:409})
  const {data:items}=await admin.from('order_items').select('product_name,size_label,size_grams,quantity,unit_price,line_total').eq('order_id',id).order('id')
  const ref=order.payment_reference||`FE-${String(order.id).slice(0,8).toUpperCase()}`;const title=type==='receipt'?'PAYMENT RECEIPT':'INVOICE';const lines:PdfLine[]=[{text:'FOLUS EMPORIUM LTD',bold:true,size:18},{text:"Nature's Goodness, Purely Yours.",size:10},{text:'Ibadan, Oyo State, Nigeria'},{text:'Email: folusemporium@gmail.com | Phone: +234 916 815 7255'},{text:''},{text:title,bold:true,size:16},{text:`Document Reference: ${type==='receipt'?'RCP':'INV'}-${ref}`,bold:true},{text:`Order Reference: ${ref}`},{text:`Order Date: ${new Date(order.created_at).toLocaleString('en-NG')}`},{text:`Order Status: ${String(order.status).toUpperCase()}`},{text:`Payment Status: ${String(order.payment_status).toUpperCase()}`},{text:`Payment Method: ${String(order.payment_method||'').replaceAll('_',' ')}`},{text:''},{text:'BILL TO',bold:true},{text:order.customer_name||'Customer'},{text:order.email||''},{text:order.phone||''},{text:order.delivery_address||''},{text:''},{text:'ITEMS',bold:true}]
  for(const item of items??[]){const size=item.size_label||(item.size_grams?`${item.size_grams}g`:'');lines.push({text:`${item.product_name}${size?` - ${size}`:''}`,bold:true},{text:`Qty ${item.quantity} x ${money(item.unit_price)} = ${money(item.line_total)}`})}
  lines.push({text:''},{text:`Subtotal: ${money(order.subtotal)}`});if(Number(order.discount_amount||0)>0)lines.push({text:`Discount: -${money(order.discount_amount)}`});lines.push({text:`Delivery (${String(order.delivery_zone||'').replaceAll('_',' ')}): ${money(order.delivery_fee)}`},{text:`TOTAL: ${money(order.total)}`,bold:true,size:14},{text:''})
  if(type==='receipt')lines.push({text:'PAYMENT CONFIRMED',bold:true},{text:`This receipt confirms payment of ${money(order.total)} for the order above.`})
  else lines.push({text:order.payment_status==='paid'?'Payment status: PAID':'Amount due: '+money(order.total),bold:true})
  lines.push({text:''},{text:'Thank you for choosing Folus Emporium Ltd.'},{text:"Nature's Goodness, Purely Yours."})
  const pdf=makePdf(lines);return new NextResponse(new Uint8Array(pdf),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="Folus-Emporium-${type}-${ref}.pdf"`,'Cache-Control':'private, no-store'}})
 }catch(e){console.error(e);return NextResponse.json({error:'Unable to generate document'},{status:500})}
}
