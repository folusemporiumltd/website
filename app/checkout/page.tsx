'use client'
import Link from 'next/link'
import {useEffect,useState} from 'react'
import {useCart} from '@/components/cart-provider'
import {createClient} from '@/lib/supabase/client'

const deliveryFees:{[key:string]:number}={ibadan:2000,lagos:5000,other:8000}

export default function CheckoutPage(){
 const {items,subtotal,clearCart}=useCart()
 const [authChecking,setAuthChecking]=useState(true)
 const [loading,setLoading]=useState(false)
 const [error,setError]=useState('')
 const [coupon,setCoupon]=useState('')
 const [discount,setDiscount]=useState(0)
 const [couponMsg,setCouponMsg]=useState('')
 const [zone,setZone]=useState('ibadan')
 const [paymentMethod,setPaymentMethod]=useState<'paystack'|'pay_after_delivery'>('paystack')
 const [placed,setPlaced]=useState<{id:string,total:number}|null>(null)
 const deliveryFee=deliveryFees[zone]||0
 const total=Math.max(0,subtotal-discount)+deliveryFee

 useEffect(()=>{
  let mounted=true
  const s=createClient()
  const check=async()=>{
   const {data}=await s.auth.getSession()
   if(!mounted)return
   if(!data.session){window.location.replace('/login?next=%2Fcheckout&mode=signin');return}
   setAuthChecking(false)
  }
  void check()
  const {data:listener}=s.auth.onAuthStateChange((_event,session)=>{
   if(!mounted)return
   if(!session)window.location.replace('/login?next=%2Fcheckout&mode=signin')
  })
  return()=>{mounted=false;listener.subscription.unsubscribe()}
 },[])

 async function applyCoupon(){
  setCouponMsg('Checking…')
  const r=await fetch('/api/coupons/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:coupon,subtotal})})
  const d=await r.json()
  if(d.valid){setCoupon(String(d.code));setDiscount(Number(d.discount));setCouponMsg(`Coupon ${d.code} applied — you save ₦${Number(d.discount).toLocaleString('en-NG')}.`)}
  else{setDiscount(0);setCouponMsg(d.message||'Coupon is not valid.')}
 }

 async function handleSubmit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setError('');setLoading(true)
  const f=new FormData(e.currentTarget),email=String(f.get('email')||'').trim(),customerName=String(f.get('name')||'').trim(),customerPhone=String(f.get('phone')||'').trim(),address=String(f.get('address')||'').trim(),city=String(f.get('city')||'').trim(),state=String(f.get('state')||'').trim(),reference=`FE-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`
  const payload={email,delivery_zone:zone,coupon_code:discount>0?coupon:'',metadata:{customer_name:customerName,customer_phone:customerPhone,delivery_address:{address,city,state},items:items.map(i=>({id:i.id.split(':')[0],variant_id:i.variantId,quantity:i.quantity}))}}
  try{
   if(paymentMethod==='pay_after_delivery'){
    const r=await fetch('/api/orders/pay-after-delivery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),d=await r.json()
    if(!r.ok)throw new Error(d.error||'Unable to place your order.')
    clearCart();setPlaced({id:String(d.order?.id||''),total:Number(d.order?.total||total)});setLoading(false);return
   }
   const r=await fetch('/api/paystack/initialize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,reference,callback_url:`${window.location.origin}/payment/callback`})})
   const d=await r.json()
   if(!r.ok)throw new Error(d.error||'Unable to start payment.')
   window.location.href=d.authorization_url
  }catch(err){setError(err instanceof Error?err.message:'Unable to continue checkout.');setLoading(false)}
 }

 if(authChecking)return <main><section className="section"><div className="container empty"><div className="eyebrow">Secure checkout</div><h1>Checking your account…</h1><p>Please wait while we confirm your signed-in session.</p></div></section></main>
 if(placed)return <main><section className="section"><div className="container empty"><div className="eyebrow">Order confirmed</div><h1>Your order has been placed.</h1><p>You selected Pay After Delivery. Order reference: <strong>{placed.id.slice(0,8).toUpperCase()}</strong>.</p><p>Total due on delivery: <strong>₦{placed.total.toLocaleString('en-NG')}</strong>.</p><Link className="btn btn-primary" href="/account">View my orders</Link> <Link className="btn btn-outline" href="/shop">Continue shopping</Link></div></section></main>
 if(!items.length)return <main><section className="section"><div className="container empty"><h1>Your cart is empty</h1><Link className="btn btn-primary" href="/shop">Shop now</Link></div></section></main>

 return <main><header className="nav"><div className="container nav-inner"><Link className="brand" href="/"><img src="/folus-emporium-circular-logo.png" alt="Folus Emporium"/><span>FOLUS<br/>EMPORIUM<small>Nature’s Goodness, Purely Yours.</small></span></Link></div></header><section className="section"><div className="container cart-layout"><form className="cart-summary" onSubmit={handleSubmit} style={{position:'static'}}><div className="eyebrow">Secure checkout</div><h1>Delivery & payment details</h1><label>Full name<input required name="name"/></label><label>Email address<input required type="email" name="email"/></label><label>Phone number<input required type="tel" name="phone"/></label><label>Delivery address<textarea required name="address" rows={4}/></label><label>City<input required name="city"/></label><label>State<input required name="state"/></label><label>Delivery location<select value={zone} onChange={e=>setZone(e.target.value)}><option value="ibadan">Within Ibadan — ₦2,000</option><option value="lagos">Lagos — ₦5,000</option><option value="other">Other State — ₦8,000</option></select></label><fieldset style={{border:'1px solid var(--line)',borderRadius:12,padding:14}}><legend style={{fontWeight:700}}>Payment option</legend><label style={{display:'flex',gap:8,alignItems:'center'}}><input type="radio" checked={paymentMethod==='paystack'} onChange={()=>setPaymentMethod('paystack')}/> Pay securely now with Paystack</label><label style={{display:'flex',gap:8,alignItems:'center',marginTop:8}}><input type="radio" checked={paymentMethod==='pay_after_delivery'} onChange={()=>setPaymentMethod('pay_after_delivery')}/> Pay After Delivery</label></fieldset>{error&&<p role="alert" style={{color:'var(--burgundy)'}}>{error}</p>}<button className="btn btn-primary checkout-btn" disabled={loading}>{loading?'Processing…':paymentMethod==='paystack'?'Pay securely with Paystack':'Place order — Pay After Delivery'}</button></form><aside className="cart-summary" style={{position:'static'}}><div className="eyebrow">Your order</div><h2>Order summary</h2>{items.map(i=><div className="summary-row" key={i.id}><span>{i.name}{i.sizeLabel?` · ${i.sizeLabel}`:''} × {i.quantity}</span><strong>₦{(i.price*i.quantity).toLocaleString('en-NG')}</strong></div>)}<div style={{borderTop:'1px solid var(--line)',paddingTop:16,marginTop:16}}><label>Discount / coupon code<div style={{display:'flex',gap:8}}><input value={coupon} onChange={e=>{setCoupon(e.target.value.toUpperCase());setDiscount(0);setCouponMsg('')}} placeholder="Enter code"/><button type="button" className="btn btn-outline" onClick={applyCoupon}>Apply</button></div></label>{couponMsg&&<p className="muted">{couponMsg}</p>}</div><div className="summary-row"><span>Subtotal</span><strong>₦{subtotal.toLocaleString('en-NG')}</strong></div>{discount>0&&<div className="summary-row"><span>Discount</span><strong>-₦{discount.toLocaleString('en-NG')}</strong></div>}<div className="summary-row"><span>Delivery ({zone==='ibadan'?'Ibadan':zone==='lagos'?'Lagos':'Other State'})</span><strong>₦{deliveryFee.toLocaleString('en-NG')}</strong></div><div className="summary-row"><span>Total</span><strong>₦{total.toLocaleString('en-NG')}</strong></div><p className="muted" style={{fontSize:12}}>Delivery charges are calculated again securely on the server before your order is accepted.</p></aside></div></section></main>
}
