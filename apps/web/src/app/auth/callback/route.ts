import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/shared/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (code !== null) {
    const supabase = await createSupabaseServerClient('read-write')
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error === null) {
      return NextResponse.redirect(new URL('/today', request.url))
    }
  }
  return NextResponse.redirect(new URL('/sign-in?error=oauth', request.url))
}
