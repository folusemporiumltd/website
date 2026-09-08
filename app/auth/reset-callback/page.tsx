'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResetCallbackPage() {
  const [message, setMessage] = useState('Preparing your secure password reset…')

  useEffect(() => {
    const completeRecovery = async () => {
      const supabase = createClient()
      const query = new URLSearchParams(window.location.search)
      const fragment = new URLSearchParams(window.location.hash.slice(1))
      const accessToken = fragment.get('access_token')
      const refreshToken = fragment.get('refresh_token')
      const code = query.get('code')

      let error: Error | null = null

      if (accessToken && refreshToken) {
        const result = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        error = result.error
      } else if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code)
        error = result.error
      } else {
        error = new Error('The password link is missing or invalid.')
      }

      if (error) {
        window.location.replace(`/reset-password?error=${encodeURIComponent('Your password link has expired or is invalid. Request a new one.')}`)
        return
      }

      window.location.replace('/reset-password?mode=update')
    }

    void completeRecovery()
  }, [])

  return (
    <main>
      <section className="section">
        <div className="container" style={{ maxWidth: 680 }}>
          <div className="eyebrow">Account security</div>
          <h1>Securing your password reset</h1>
          <p>{message}</p>
        </div>
      </section>
    </main>
  )
}
