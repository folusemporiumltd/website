import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/reset-password?error=The+password+link+is+missing+or+invalid.', url.origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/reset-password?error=Your+password+link+has+expired+or+is+invalid.+Request+a+new+one.', url.origin))
  }

  return NextResponse.redirect(new URL('/reset-password?mode=update', url.origin))
}
