import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { signOut } from '@/features/auth/actions'
import { acceptUpdatedTerms } from '@/features/legal/actions'
import { TermsUpdate } from '@/features/legal/components/terms-update'
import { homePathOf } from '@/shared/lib/auth/destination'
import { requireProfile, requireUser } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal.update.meta')
  return { title: t('title') }
}

export default async function AcceptTermsPage() {
  await requireUser()
  const profile = await requireProfile()
  if (!profile.termsOutdated) {
    redirect(homePathOf(profile.accountType))
  }
  return <TermsUpdate accept={acceptUpdatedTerms} signOut={signOut} />
}
