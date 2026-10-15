import { NextResponse, type NextRequest } from 'next/server'
import { rememberContinuePath } from '@/shared/lib/auth/continue-path'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  await rememberContinuePath(searchParams.get('to') ?? '')
  const entry = searchParams.get('via') === 'sign-in' ? '/sign-in' : '/sign-up'
  return NextResponse.redirect(new URL(entry, request.url))
}
