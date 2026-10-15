import type { NextRequest } from 'next/server'
import { rememberContinuePath } from '@/shared/lib/auth/continue-path'
import { siteRedirect } from '@/shared/lib/site-redirect'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  await rememberContinuePath(searchParams.get('to') ?? '')
  const entry = searchParams.get('via') === 'sign-in' ? '/sign-in' : '/sign-up'
  return siteRedirect(entry)
}
