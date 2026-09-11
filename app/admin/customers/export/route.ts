import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function cell(value: unknown) {
  const text=String(value??'')
  return `"${text.replace(/"/g,'""')}"`
}

export async function GET(){
  const supabase=await createClient()
  const {data:auth}=await supabase.auth.getUser()
  if(!auth.user)return NextResponse.json({error:'Unauthorized'},{status:401})
  const {data:isAdmin}=await supabase.rpc('get_my_admin_status')
  if(isAdmin!==true)return NextResponse.json({error:'Forbidden'},{status:403})

  const {data:customers,error}=await supabase.rpc('list_admin_customer_crm')
  if(error)return NextResponse.json({error:error.message||'Customer export failed'},{status:500})

  const header=['Customer Name','Email','Phone','Customer Type','Newsletter Status','Total Orders','Paid Orders','Delivered Orders','Lifetime Spend (NGN)','Last Order Date','Last Order Status','Last Payment Status','Last Delivery Zone','Last Delivery Address','Joined Date']
  const lines=[header.map(cell).join(',')]

  for(const c of customers??[]){
    lines.push([
      c.full_name||'',c.email||'',c.phone||'',c.customer_type||'',c.newsletter_status||'',
      c.total_orders??0,c.paid_orders??0,c.delivered_orders??0,Number(c.lifetime_spend||0).toFixed(2),
      c.last_order_at||'',c.last_order_status||'',c.last_payment_status||'',c.last_delivery_zone||'',c.last_delivery_address||'',c.joined_at||''
    ].map(cell).join(','))
  }

  const filename=`folus-customer-crm-${new Date().toISOString().slice(0,10)}.csv`
  return new NextResponse('\uFEFF'+lines.join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${filename}"`,'Cache-Control':'no-store'}})
}
