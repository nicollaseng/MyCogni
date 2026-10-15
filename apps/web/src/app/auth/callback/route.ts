import { after, type NextRequest } from 'next/server'
import { afterEmailLink, afterSignIn } from '@/features/auth/after-sign-in'
import { emailLinkFailedPath, emailLinkTypeOf } from '@/features/auth/email-link'
import { importProviderPhoto } from '@/features/auth/provider-photo'
import { adoptLocaleOf } from '@/features/locale/adopt-locale'
import { createSupabaseServerClient } from '@/shared/lib/supabase/server'
import { siteRedirect } from '@/shared/lib/site-redirect'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const flow = emailLinkTypeOf(searchParams.get('flow'))
  const code = searchParams.get('code')
  if (code !== null) {
    const supabase = await createSupabaseServerClient('read-write')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error === null) {
      if (data.user.identities?.some((identity) => identity.provider === 'google') === true) {
        const { access_token: accessToken } = data.session
        after(() => importProviderPhoto(accessToken))
      }
      await adoptLocaleOf(data.user.user_metadata)
      const destination = flow === null ? await afterSignIn() : await afterEmailLink(flow)
      return siteRedirect(destination)
    }
  }
  const failure = flow === null ? '/sign-in?error=oauth' : emailLinkFailedPath
  return siteRedirect(failure)
}
