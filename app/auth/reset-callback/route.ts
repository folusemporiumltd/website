import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      new URL('/reset-password?error=This+password+link+is+invalid+or+has+expired.+Please+request+a+new+one.', url.origin)
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL('/reset-password?error=This+password+link+is+invalid+or+has+expired.+Please+request+a+new+one.', url.origin)
    )
  }

  return NextResponse.redirect(new URL('/reset-password?mode=update', url.origin))
}
