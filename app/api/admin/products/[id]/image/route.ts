import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return NextResponse.json({ error: 'You must be signed in as an administrator.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 })

  const { id } = await params
  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No image was provided.' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Image must be 5MB or smaller.' }, { status: 400 })

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `products/${id}.${extension}`
  const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 })

  const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(path)
  const { data: product, error: updateError } = await supabase.from('products').update({ image_url: publicData.publicUrl, updated_at: new Date().toISOString() }).eq('id', id).select('slug').single()
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath('/admin')
  if (product?.slug) revalidatePath(`/shop/${product.slug}`)
  return NextResponse.json({ url: publicData.publicUrl })
}
