import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { TermsOfUse } from '@/features/legal/components/terms-of-use'
import { chooseLocale } from '@/features/locale/actions'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal.terms')
  return { title: t('title') }
}

export default function TermsPage() {
  return <TermsOfUse chooseLocale={chooseLocale} />
}
