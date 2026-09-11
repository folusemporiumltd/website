import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL = 'https://boaaiskncrfmaismhqno.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_SQQVr7OX77UswU1WadKsSA_dSV1jeNi'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    }
  )

  const { data } = await supabase.auth.getClaims()
  const user = data?.claims
  const pathname = request.nextUrl.pathname
  const publicRoute =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/reset-password') ||
    pathname === '/shop' ||
    pathname.startsWith('/shop/') ||
    pathname === '/cart' ||
    pathname === '/wishlist' ||
    pathname === '/about' ||
    pathname.startsWith('/about/') ||
    pathname === '/blog' ||
    pathname.startsWith('/blog/') ||
    pathname === '/careers' ||
    pathname.startsWith('/careers/') ||
    pathname === '/faq' ||
    pathname === '/shipping-policy' ||
    pathname === '/return-policy' ||
    pathname === '/privacy-policy' ||
    pathname === '/terms-and-conditions' ||
    pathname === '/contact' ||
    pathname.startsWith('/p/') ||
    pathname.startsWith('/payment/callback') ||
    pathname === '/api/paystack/webhook'

  if (!user && !publicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
