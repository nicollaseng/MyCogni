import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/shared/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient('read-write')
  await supabase.auth.signOut({ scope: 'local' })
  return NextResponse.redirect(new URL('/sign-in?error=session', request.url))
}
