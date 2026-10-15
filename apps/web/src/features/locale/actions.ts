'use server'

import { isLocale } from '@mycogni/domain'
import { revalidatePath } from 'next/cache'
import { updateProfile } from '@/shared/lib/api/resources'
import { createSupabaseServerClient } from '@/shared/lib/supabase/server'
import { rememberLocale } from './remember-locale'

export async function chooseLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) {
    return
  }
  await rememberLocale(locale)
  const supabase = await createSupabaseServerClient('read-write')
  const { data } = await supabase.auth.getClaims()
  if (data !== null) {
    try {
      await Promise.all([updateProfile({ locale }), supabase.auth.updateUser({ data: { locale } })])
    } catch (cause) {
      console.error(cause)
    }
  }
  revalidatePath('/', 'layout')
}
