import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function hasManualSession(request: NextRequest) {
  const raw = request.cookies.get('nexora_manual_session')?.value
  return Boolean(raw && raw.includes('.') && raw.length > 40)
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
        },
      },
    }
  )

  const { data: claims } = await supabase.auth.getClaims()
  const pathname = request.nextUrl.pathname
  const isAppRoute = pathname === '/app' || pathname.startsWith('/app/')
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  const authenticated = Boolean(claims?.claims) || (isAdminRoute && hasManualSession(request))

  if ((isAppRoute || isAdminRoute) && !authenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return response
}
