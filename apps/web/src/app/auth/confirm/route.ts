import type { NextRequest } from 'next/server'
import { afterEmailLink } from '@/features/auth/after-sign-in'
import { emailLinkFailedPath, emailLinkTypeOf } from '@/features/auth/email-link'
import { adoptLocaleOf } from '@/features/locale/adopt-locale'
import { createSupabaseServerClient } from '@/shared/lib/supabase/server'
import { siteRedirect } from '@/shared/lib/site-redirect'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const type = emailLinkTypeOf(searchParams.get('type'))
  const tokenHash = searchParams.get('token_hash')
  if (type !== null && tokenHash !== null && tokenHash !== '') {
    const supabase = await createSupabaseServerClient('read-write')
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error === null) {
      await adoptLocaleOf(data.user?.user_metadata)
      return siteRedirect(await afterEmailLink(type))
    }
  }
  return siteRedirect(emailLinkFailedPath)
}
