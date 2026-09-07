'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutButton() {
  const [href, setHref] = useState('/login?next=/checkout&mode=signin')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    const refresh = async () => {
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      setHref(data.user ? '/checkout' : '/login?next=/checkout&mode=signin')
      setChecking(false)
    }

    refresh()
    const { data: listener } = supabase.auth.onAuthStateChange(() => refresh())

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <Link className="btn btn-primary checkout-btn" href={href} aria-disabled={checking}>
      {checking ? 'Checking account…' : href === '/checkout' ? 'Proceed to checkout' : 'Sign in to checkout'}
    </Link>
  )
}
