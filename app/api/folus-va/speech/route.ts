import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: Request) {
  let body: { text?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }
  const text = String(body.text ?? '').trim().slice(0, 1800)
  if (!text) return NextResponse.json({ error: 'No text was provided.' }, { status: 400 })
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Natural voice is not configured.' }, { status: 503 })

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: 'coral',
      input: text.replace(/₦/g, ' naira '),
      instructions: 'Speak as a warm, confident Nigerian woman using natural Nigerian English. Sound friendly, polished and conversational, never robotic. Use a moderate pace, gentle warmth and clear pronunciation. Do not exaggerate the accent.',
      response_format: 'wav',
    }),
  })
  if (!response.ok) return NextResponse.json({ error: 'Voice generation is temporarily unavailable.' }, { status: 502 })
  return new NextResponse(response.body, { headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'private, no-store' } })
}
