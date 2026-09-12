'use client'

import { useRef, useState } from 'react'

type Props = { productId: string; productName: string; currentUrl?: string | null }

const MAX_UPLOAD = 5 * 1024 * 1024
const DIRECT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])

async function prepareMobileImage(file: File): Promise<File> {
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

export default function AdminProductImageUploader({ productId, productName, currentUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(currentUrl || '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function upload(originalFile: File) {
    setBusy(true)
    setMessage('Preparing image…')
    try {
      const file = await prepareMobileImage(originalFile)
      setMessage('Uploading…')
      const body = new FormData()
      body.append('file', file)
      const response = await fetch(`/api/admin/products/${productId}/image`, { method: 'POST', body })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Upload failed.')
      setUrl(data.url)
      setMessage('Image saved. Refreshing catalogue…')
      window.location.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="admin-image-uploader" style={{width:'100%',minWidth:0}}>
    <div className="admin-image-preview">{url ? <img src={url} alt={`${productName} product flyer`}/> : <span>No product image yet</span>}</div>
    <div style={{display:'grid',gap:8,width:'100%'}}>
      <button type="button" className="btn btn-outline" style={{width:'100%',minHeight:48}} onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? 'Uploading…' : 'Choose / upload product image'}</button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label={`Upload image for ${productName}`}
        style={{position:'absolute',width:1,height:1,opacity:0,pointerEvents:'none'}}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) upload(file)
          e.currentTarget.value = ''
        }}
      />
      <small className="muted">On mobile, choose from Photos/Gallery or take a new photo. Large phone photos are automatically resized before upload.</small>
      {message && <span className="muted" role="status" aria-live="polite">{message}</span>}
    </div>
  </div>
}
