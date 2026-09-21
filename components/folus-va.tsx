'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { useCart } from './cart-provider'

type Message = { role: 'user' | 'assistant'; content: string }
type Product = { id: string; name: string; slug: string; image_url?: string | null; variants: Array<{ id: string; size: string; price: number; stock: number }> }
const welcome = 'Hello! I’m Folus VA. Ask me about Folus Emporium, our products, prices and availability, or tell me what you would like to order.'

export default function FolusVA() {
  const { items, addItem } = useCart()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: welcome }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceOn, setVoiceOn] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [needsRegistration, setNeedsRegistration] = useState(false)
  const [checkoutReady, setCheckoutReady] = useState(false)
  const [offerAgent, setOfferAgent] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, busy, products, needsRegistration])
  useEffect(() => () => { audioRef.current?.pause(); window.speechSynthesis?.cancel() }, [])

  async function speak(text: string) {
    if (!voiceOn) return
    audioRef.current?.pause()
    try {
      const response = await fetch('/api/folus-va/speech', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      if (!response.ok) throw new Error('Natural voice unavailable')
      const url = URL.createObjectURL(await response.blob())
      const audio = new Audio(url); audioRef.current = audio
      audio.onended = () => URL.revokeObjectURL(url)
      await audio.play()
    } catch {
      if (!('speechSynthesis' in window)) return
      const utterance = new SpeechSynthesisUtterance(text.replace(/[₦]/g, ' naira '))
      utterance.lang = 'en-NG'; utterance.rate = 0.94
      window.speechSynthesis.speak(utterance)
    }
  }

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || busy) return
    const nextMessages = [...messages, { role: 'user' as const, content }]
    setMessages(nextMessages); setInput(''); setBusy(true); setError(''); setProducts([]); setOfferAgent(false); setNeedsRegistration(false); setCheckoutReady(false)
    try {
      const response = await fetch('/api/folus-va', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: content, messages: nextMessages, cart: items }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Folus VA could not respond just now.')
      const reply = String(data.reply || 'How else may I help?')
      setMessages(current => [...current, { role: 'assistant', content: reply }]); setProducts(Array.isArray(data.products) ? data.products : []); setNeedsRegistration(Boolean(data.needsRegistration)); setCheckoutReady(Boolean(data.checkoutRequested && data.signedIn)); setOfferAgent(Boolean(data.offerLiveAgent))
      for (const item of data.cartAdds ?? []) addItem({ id: item.id, name: item.name, slug: item.slug, image_url: item.image_url, price: item.price, variantId: item.variantId, sizeGrams: item.sizeGrams, sizeLabel: item.sizeLabel }, item.quantity)
      void speak(reply)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Folus VA could not respond just now.'); setOfferAgent(true) } finally { setBusy(false) }
  }

  function startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { setError('Voice input is not available in this browser. You can type your message below.'); return }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-NG'; recognition.interimResults = false; recognition.continuous = false
    recognition.onstart = () => { setListening(true); setError('') }; recognition.onend = () => setListening(false)
    recognition.onerror = () => { setListening(false); setError('I could not hear that clearly. Please try again or type your message.') }
    recognition.onresult = (event: any) => { const transcript = event.results?.[0]?.[0]?.transcript || ''; setInput(transcript); void send(transcript) }
    recognition.start()
  }

  function saveRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const draft = Object.fromEntries(['name', 'email', 'phone', 'address', 'city', 'state'].map(key => [key, String(form.get(key) || '').trim()]))
    window.localStorage.setItem('folus-va-registration', JSON.stringify(draft))
    window.location.assign('/login?next=%2Fcheckout&mode=signup&prefill=1')
  }

  return <>
    <button className="folus-va-launcher" type="button" onClick={() => setOpen(true)} aria-label="Talk to Folus VA"><span aria-hidden="true">◉</span><b>Talk to Folus VA</b></button>
    {open ? <section className="folus-va-panel" role="dialog" aria-modal="true" aria-label="Folus VA shopping assistant">
      <header><div><strong>Folus VA</strong><small>Nigerian Voice Shopping Assistant</small></div><div className="folus-va-head-actions"><button type="button" onClick={() => { audioRef.current?.pause(); setVoiceOn(value => !value) }} aria-label={voiceOn ? 'Mute voice' : 'Turn on voice'}>{voiceOn ? '🔊' : '🔇'}</button><button type="button" onClick={() => { audioRef.current?.pause(); window.speechSynthesis?.cancel(); setOpen(false) }} aria-label="Close Folus VA">×</button></div></header>
      <div className="folus-va-messages" aria-live="polite">
        {messages.map((message, index) => <div className={`folus-va-bubble ${message.role}`} key={index}><span>{message.role === 'assistant' ? 'Folus VA' : 'You'}</span><p>{message.content}</p></div>)}
        {busy ? <div className="folus-va-bubble assistant"><span>Folus VA</span><p>Let me check that for you…</p></div> : null}
        {products.length ? <div className="folus-va-products">{products.map(product => <Link href={`/shop/${product.slug}`} key={product.id}><div className="folus-va-product-image">{product.image_url ? <img src={product.image_url} alt="" /> : product.name}</div><strong>{product.name}</strong><small>{product.variants[0] ? `${product.variants[0].size} · ₦${Number(product.variants[0].price).toLocaleString('en-NG')}` : 'View product'}</small></Link>)}</div> : null}
        {needsRegistration ? <form className="folus-va-registration" onSubmit={saveRegistration}><strong>Let’s prepare your secure registration</strong><p>Folus VA can prefill these details. You will create your password privately on the next page.</p><input name="name" placeholder="Full name" autoComplete="name" required/><input name="email" type="email" placeholder="Email address" autoComplete="email" required/><input name="phone" type="tel" placeholder="Phone number" autoComplete="tel" required/><textarea name="address" placeholder="Delivery address" autoComplete="street-address" required/><div><input name="city" placeholder="City" required/><input name="state" placeholder="State" required/></div><button className="btn btn-primary" type="submit">Continue securely</button></form> : null}
        {checkoutReady ? <Link href="/checkout" className="btn btn-primary folus-va-checkout">Proceed to checkout</Link> : null}
        {offerAgent ? <a className="btn btn-outline folus-va-agent" href="https://wa.me/2349168157255?text=Hello%20Folus%20Emporium%2C%20Folus%20VA%20referred%20me%20to%20a%20live%20agent." target="_blank" rel="noopener noreferrer">Connect with a Live Agent</a> : null}
        {error ? <p className="folus-va-error" role="alert">{error}</p> : null}<div ref={endRef}/>
      </div>
      <div className="folus-va-quick"><button type="button" onClick={() => send('What products do you have?')} disabled={busy}>Products</button><button type="button" onClick={() => send('Help me make an order')} disabled={busy}>Make an order</button><button type="button" onClick={() => send('I want to speak with a live agent')} disabled={busy}>Live agent</button></div>
      <form className="folus-va-composer" onSubmit={event => { event.preventDefault(); void send() }}><button className={listening ? 'listening' : ''} type="button" onClick={startListening} disabled={busy} aria-label="Speak to Folus VA">🎙</button><input value={input} onChange={event => setInput(event.target.value)} placeholder="Speak or type your message…" maxLength={1500}/><button type="submit" disabled={busy || !input.trim()} aria-label="Send message">➤</button></form>
      <footer>Folus VA uses an AI-generated Nigerian female voice. Never share your password, PIN or OTP.</footer>
    </section> : null}
  </>
}
