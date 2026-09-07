'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutButton() {
  const [href, setHref] = useState('/login?next=/checkout')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getClaims().then(({ data }) => {
      setHref(data?.claims?.sub ? '/checkout' : '/login?next=/checkout')
      setChecking(false)
    }).catch(() => setChecking(false))
  }, [])

  return (
    <Link className="btn btn-primary checkout-btn" href={href} aria-disabled={checking}>
      {checking ? 'Checking account…' : href === '/checkout' ? 'Proceed to checkout' : 'Register / sign in to checkout'}
    </Link>
  )
}
