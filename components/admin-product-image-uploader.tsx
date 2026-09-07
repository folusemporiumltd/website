'use client'

import { useRef, useState } from 'react'

type Props = { productId: string; productName: string; currentUrl?: string | null }

export default function AdminProductImageUploader({ productId, productName, currentUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(currentUrl || '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) return setMessage('Please choose an image file.')
    if (file.size > 5 * 1024 * 1024) return setMessage('Image must be 5MB or smaller.')
    setBusy(true); setMessage('Uploading…')
    try {
      const body = new FormData(); body.append('file', file)
      const response = await fetch(`/api/admin/products/${productId}/image`, { method: 'POST', body })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Upload failed.')
      setUrl(data.url); setMessage('Image saved. Refreshing catalogue…')
      window.location.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed.')
    } finally { setBusy(false) }
  }

  return <div className="admin-image-uploader">
    <div className="admin-image-preview">{url ? <img src={url} alt={`${productName} product flyer`}/> : <span>No product image yet</span>}</div>
    <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
      <button type="button" className="btn btn-outline" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? 'Uploading…' : 'Upload product flyer'}</button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" hidden onChange={e => { const file = e.target.files?.[0]; if (file) upload(file); e.currentTarget.value = '' }} />
      {message && <span className="muted" role="status">{message}</span>}
    </div>
  </div>
}
