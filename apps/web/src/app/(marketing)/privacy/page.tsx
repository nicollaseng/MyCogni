import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PrivacyPolicy } from '@/features/legal/components/privacy-policy'
import { chooseLocale } from '@/features/locale/actions'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal.privacy')
  return { title: t('title') }
}

export default function PrivacyPage() {
  return <PrivacyPolicy chooseLocale={chooseLocale} />
}
