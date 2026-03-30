/**
 * Supabase auth middleware helper.
 *
 * Refreshes the session on every request and protects routes
 * under /(app)/ — redirects unauthenticated users to /auth/login.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/queue')
    || request.nextUrl.pathname.startsWith('/article')
    || request.nextUrl.pathname.startsWith('/sources')
    || request.nextUrl.pathname.startsWith('/stats')
    || request.nextUrl.pathname.startsWith('/settings')
    || request.nextUrl.pathname.startsWith('/bookmarks')
    || request.nextUrl.pathname.startsWith('/onboarding')

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from landing/login to queue
  const isAuthRoute = request.nextUrl.pathname === '/'
    || request.nextUrl.pathname === '/auth/login'

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/queue'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
