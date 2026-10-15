import { getLocale } from 'next-intl/server'
import { updateProfile } from '@/shared/lib/api/resources'
import { createSupabaseServerClient } from '@/shared/lib/supabase/server'
import { rememberLocaleOf } from './remember-locale'

export async function adoptLocaleOf(userMetadata: unknown): Promise<void> {
  if (await rememberLocaleOf(userMetadata)) {
    return
  }
  const locale = await getLocale()
  try {
    const supabase = await createSupabaseServerClient('read-write')
    await Promise.all([supabase.auth.updateUser({ data: { locale } }), updateProfile({ locale })])
  } catch (cause) {
    console.error(cause)
  }
}
