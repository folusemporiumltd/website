'use client'

import { ChangeEvent, useState } from 'react'

const MAX_UPLOAD = 5 * 1024 * 1024
const DIRECT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

async function prepareImage(file: File): Promise<File> {
  if (DIRECT_TYPES.has(file.type) && file.size <= MAX_UPLOAD) return file
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image from your phone or gallery.')

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('This image format could not be prepared. Please choose JPG, PNG or WEBP.'))
      img.src = objectUrl
    })

    const maxSide = 1600
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Your browser could not prepare this image.')
    context.drawImage(image, 0, 0, width, height)

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.84))
    if (!blob) throw new Error('Your browser could not prepare this image.')
    if (blob.size > MAX_UPLOAD) throw new Error('The image is still too large. Please choose a smaller photo.')
    const safeName = (file.name.replace(/\.[^.]+$/, '') || 'product-image') + '.jpg'
    return new File([blob], safeName, { type: 'image/jpeg', lastModified: Date.now() })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export default function AdminNewProductImageField() {
  const [preview, setPreview] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function onChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const original = input.files?.[0]
    if (!original) return

    setBusy(true)
    setMessage('Preparing image…')
    try {
      const file = await prepareImage(original)
      const transfer = new DataTransfer()
      transfer.items.add(file)
      input.files = transfer.files
      if (preview) URL.revokeObjectURL(preview)
      setPreview(URL.createObjectURL(file))
      setMessage('Image ready. It will upload when you create the product.')
    } catch (error) {
      input.value = ''
      setPreview('')
      setMessage(error instanceof Error ? error.message : 'Could not prepare image.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="admin-new-product-image" style={{display:'grid',gap:10,padding:14,border:'1px solid var(--line)',borderRadius:12,background:'#fcfaf7'}}>
    <strong>Product image</strong>
    {preview ? <img src={preview} alt="New product preview" style={{width:'100%',maxWidth:220,aspectRatio:'1 / 1',objectFit:'contain',border:'1px solid var(--line)',borderRadius:12,background:'#fff'}}/> : null}
    <label style={{margin:0}}>Choose product image
      <input name="image_file" type="file" accept="image/*" onChange={onChange} disabled={busy} style={{background:'#fff'}} />
    </label>
    <small className="muted">On mobile, choose from Photos/Gallery or take a new photo. Large phone photos are automatically resized before the form is submitted.</small>
    {message ? <span className="muted" role="status" aria-live="polite">{message}</span> : null}
  </div>
}
