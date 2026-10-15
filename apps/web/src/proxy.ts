import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { publicEnv } from '@/shared/lib/env'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { supabaseUrl, supabaseKey } = publicEnv()

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  await supabase.auth.getClaims()

  return response
}

export const config = {
  matcher: [
    '/today/:path*',
    '/entries/:path*',
    '/mybook',
    '/mybook/:path',
    '/patterns/:path*',
    '/me/:path*',
    '/check-in/:path*',
    '/onboarding/:path*',
    '/questionnaires/:path*',
    '/invite/:path*',
    '/invites/:path*',
    '/notifications/:path*',
    '/support/:path*',
    '/pro/:path*',
    '/admin/:path*',
    '/sign-in',
    '/sign-up',
    '/verify',
    '/forgot-password',
    '/reset-password',
  ],
}
