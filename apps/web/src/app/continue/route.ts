import type { NextRequest } from 'next/server'
import { continueTargetOf, rememberContinuePath } from '@/shared/lib/auth/continue-path'
import { siteRedirect } from '@/shared/lib/site-redirect'

function entryOf(via: string | null, to: string): string {
  if (via === 'sign-in') {
    return '/sign-in'
  }
  return continueTargetOf(to) === '/pro/join' ? '/sign-up?account=professional' : '/sign-up'
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const to = searchParams.get('to') ?? ''
  await rememberContinuePath(to)
  return siteRedirect(entryOf(searchParams.get('via'), to))
}
