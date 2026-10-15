import { NextResponse } from 'next/server'
import { siteUrlOf } from './site-url'

export function siteRedirect(path: string): NextResponse {
  return NextResponse.redirect(siteUrlOf(path))
}
