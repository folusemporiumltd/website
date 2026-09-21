import { NextResponse } from 'next/server'
import { createCatalogueClient, createClient } from '@/lib/supabase/server'

export const maxDuration = 30

type ChatMessage = { role: 'user' | 'assistant'; content: string }
type CartLine = { id: string; name: string; quantity: number; sizeLabel?: string; price: number }
const WHATSAPP_URL = 'https://wa.me/2349168157255?text=Hello%20Folus%20Emporium%2C%20Folus%20VA%20referred%20me%20to%20a%20live%20agent.'
const COMPANY_CONTEXT = `Folus Emporium Ltd is a Nigerian food and lifestyle business based in Ibadan, Oyo State, serving homes and businesses across Nigeria. Its tagline is “Nature’s Goodness, Purely Yours.” The business offers carefully sourced, processed and packaged products, kitchen and home solutions, event services, logistics and commerce, fashion/textile services, and bridal consulting. Store support is available by WhatsApp on +234 916 815 7255 and email at folusemporium@gmail.com. Payment is completed only on the website's secure checkout. Never ask for a card number, PIN, CVV, OTP or password.`

function textFromResponse(response: any) {
  if (typeof response?.output_text === 'string') return response.output_text.trim()
  const parts: string[] = []
  for (const item of response?.output ?? []) for (const content of item?.content ?? []) if (typeof content?.text === 'string') parts.push(content.text)
  return parts.join('\n').trim()
}

function fallbackReply(message: string, products: any[]) {
  const words = message.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 2)
  const matches = products.filter(product => words.some(word => `${product.name} ${product.description ?? ''}`.toLowerCase().includes(word))).slice(0, 3)
  if (matches.length) return `I found ${matches.map(product => product.name).join(', ')} in our current catalogue. Ask me for a price, available size, or say which one you would like to add to your cart.`
  return 'I can help with Folus Emporium products, prices, availability, cart and checkout. Please tell me what you would like, or I can connect you with a live agent on WhatsApp.'
}

export async function POST(request: Request) {
  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }
  const message = String(body.message ?? '').trim().slice(0, 1500)
  const history: ChatMessage[] = Array.isArray(body.messages) ? body.messages.slice(-10).filter((item: any) => (item?.role === 'user' || item?.role === 'assistant') && typeof item?.content === 'string').map((item: any) => ({ role: item.role, content: item.content.slice(0, 1500) })) : []
  const cart: CartLine[] = Array.isArray(body.cart) ? body.cart.slice(0, 40).map((item: any) => ({ id: String(item.id ?? ''), name: String(item.name ?? ''), quantity: Math.max(1, Math.min(100, Number(item.quantity) || 1)), sizeLabel: String(item.sizeLabel ?? ''), price: Number(item.price) || 0 })) : []
  if (!message) return NextResponse.json({ error: 'Please say or type a question for Folus VA.' }, { status: 400 })

  const catalogue = await createCatalogueClient()
  const [{ data: productsData }, { data: variantsData }] = await Promise.all([
    catalogue.from('products').select('id,name,slug,description,image_url,price,default_size_grams').eq('is_active', true).order('name'),
    catalogue.from('product_variants').select('id,product_id,size_grams,size_label,price,stock_quantity').eq('is_active', true).gt('price', 0).order('size_grams'),
  ])
  const products = productsData ?? []
  const variants = variantsData ?? []
  const catalogueContext = products.map((product: any) => ({ ...product, variants: variants.filter((variant: any) => variant.product_id === product.id).map((variant: any) => ({ id: variant.id, size: variant.size_label, sizeGrams: variant.size_grams, price: Number(variant.price), stock: Number(variant.stock_quantity) })) }))
  const customerClient = await createClient()
  const { data: authData } = await customerClient.auth.getUser()
  const signedIn = Boolean(authData.user)
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ reply: fallbackReply(message, products), products: [], cartAdds: [], offerLiveAgent: true, whatsappUrl: WHATSAPP_URL, signedIn })

  const schema = { type: 'object', additionalProperties: false, properties: { reply: { type: 'string' }, productIds: { type: 'array', items: { type: 'string' }, maxItems: 4 }, cartAdds: { type: 'array', maxItems: 6, items: { type: 'object', additionalProperties: false, properties: { productId: { type: 'string' }, variantId: { type: 'string' }, quantity: { type: 'integer', minimum: 1, maximum: 100 } }, required: ['productId', 'variantId', 'quantity'] } }, checkoutRequested: { type: 'boolean' }, offerLiveAgent: { type: 'boolean' } }, required: ['reply', 'productIds', 'cartAdds', 'checkoutRequested', 'offerLiveAgent'] }
  const instructions = `You are Folus VA, the warm, concise female virtual shopping assistant for Folus Emporium. Answer questions about the company using COMPANY INFORMATION and about products using only LIVE CATALOGUE. Never invent prices, stock, benefits, ingredients, policies or order status. Quote Naira accurately. Recommend relevant catalogue products when useful. If a user explicitly asks to add or buy a product and exactly one product and variant is clear, include it in cartAdds; otherwise ask a clarifying question. Do not add unavailable stock or more than available stock. Set checkoutRequested only when the customer asks to order, pay, register, or proceed to checkout. If checkout is requested and they are not signed in, explain that you need their full name, email, phone number and delivery address, but their password will be entered privately on the secure registration page. Never ask for payment credentials or passwords. Offer a live WhatsApp agent when the question cannot be answered reliably, the user asks for a person, has a complaint, needs order-specific help, or declines registration. Keep spoken replies under 90 words where possible.`
  const aiResponse = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.OPENAI_CUSTOMER_VA_MODEL || process.env.OPENAI_AGENT_MODEL || 'gpt-5.6-luna', store: false, instructions, input: `COMPANY INFORMATION\n${COMPANY_CONTEXT}\n\nSIGNED IN: ${signedIn}\nCURRENT CART\n${JSON.stringify(cart)}\n\nLIVE CATALOGUE\n${JSON.stringify(catalogueContext)}\n\nRECENT CONVERSATION\n${history.map(item => `${item.role}: ${item.content}`).join('\n')}\n\nCUSTOMER\n${message}`, text: { format: { type: 'json_schema', name: 'folus_va_response', strict: true, schema } } }) })
  const raw = await aiResponse.json()
  if (!aiResponse.ok) return NextResponse.json({ reply: fallbackReply(message, products), products: [], cartAdds: [], offerLiveAgent: true, whatsappUrl: WHATSAPP_URL, signedIn })
  let answer: any
  try { answer = JSON.parse(textFromResponse(raw)) } catch { answer = { reply: fallbackReply(message, products), productIds: [], cartAdds: [], checkoutRequested: false, offerLiveAgent: true } }
  const productMap = new Map(catalogueContext.map((product: any) => [product.id, product]))
  const safeAdds = (Array.isArray(answer.cartAdds) ? answer.cartAdds : []).flatMap((add: any) => { const product: any = productMap.get(String(add.productId)); const variant = product?.variants.find((item: any) => item.id === String(add.variantId)); const quantity = Math.max(1, Math.min(100, Math.floor(Number(add.quantity) || 1))); if (!product || !variant || variant.stock < quantity) return []; return [{ id: `${product.id}:${variant.id}`, productId: product.id, variantId: variant.id, name: product.name, slug: product.slug, image_url: product.image_url, price: variant.price, sizeGrams: variant.sizeGrams, sizeLabel: variant.size, quantity }] })
  const shownProducts = (Array.isArray(answer.productIds) ? answer.productIds : []).map((id: any) => productMap.get(String(id))).filter(Boolean).slice(0, 4).map((product: any) => ({ id: product.id, name: product.name, slug: product.slug, image_url: product.image_url, variants: product.variants.filter((variant: any) => variant.stock > 0) }))
  return NextResponse.json({ reply: String(answer.reply || fallbackReply(message, products)).slice(0, 1800), products: shownProducts, cartAdds: safeAdds, checkoutRequested: Boolean(answer.checkoutRequested), needsRegistration: Boolean(answer.checkoutRequested && !signedIn), offerLiveAgent: Boolean(answer.offerLiveAgent), whatsappUrl: WHATSAPP_URL, signedIn })
}
