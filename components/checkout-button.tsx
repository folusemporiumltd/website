'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutButton() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    const refresh = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSignedIn(Boolean(data.session?.user))
    }

    refresh()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSignedIn(Boolean(session?.user))
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const href = signedIn === false ? '/login?next=/checkout&mode=signin' : '/checkout'
  const label = signedIn === null ? 'Proceed to checkout' : signedIn ? 'Proceed to checkout' : 'Sign in to checkout'

  return (
    <Link className="btn btn-primary checkout-btn" href={href}>
      {label}
    </Link>
  )
}
