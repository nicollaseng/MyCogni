import { NextResponse, type NextRequest } from 'next/server'
import { adoptLocaleOf } from '@/features/locale/adopt-locale'
import { createSupabaseServerClient } from '@/shared/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (code !== null) {
    const supabase = await createSupabaseServerClient('read-write')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error === null) {
      await adoptLocaleOf(data.user.user_metadata)
      return NextResponse.redirect(new URL('/today', request.url))
    }
  }
  return NextResponse.redirect(new URL('/sign-in?error=oauth', request.url))
}
