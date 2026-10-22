'use server'

import { legalConsentKinds } from '@mycogni/domain'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { attempt, type ActionResult } from '@/shared/lib/actions/result'
import { fetchProfile, grantConsents } from '@/shared/lib/api/resources'
import { homePathOf } from '@/shared/lib/auth/destination'

export async function acceptUpdatedTerms(): Promise<ActionResult<null>> {
  const t = await getTranslations('account.feedback')
  const result = await attempt(async () => {
    await grantConsents({ kinds: [...legalConsentKinds] })
    return (await fetchProfile()).accountType
  }, t('saveError'))
  if (!result.ok) {
    return result
  }
  redirect(homePathOf(result.value))
}
