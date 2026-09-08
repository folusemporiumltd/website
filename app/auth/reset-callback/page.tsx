'use client'

import { useEffect } from 'react'

export default function ResetCallbackPage() {
  useEffect(() => {
    const destination = `/reset-password?mode=update${window.location.search}${window.location.hash}`
    window.location.replace(destination)
  }, [])

  return (
    <main>
      <section className="section">
        <div className="container" style={{ maxWidth: 680 }}>
          <div className="eyebrow">Account security</div>
          <h1>Securing your password reset</h1>
          <p>Preparing your secure password reset…</p>
        </div>
      </section>
    </main>
  )
}
