import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { PageTitle } from '@/shared/components/page-title'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('patterns.meta')
  return { title: t('title') }
}

export default function PatternsPage() {
  const t = useTranslations('patterns')

  return (
    <>
      <PageTitle title={t('title')} description={t('description')} />
      <p className="border-t border-rule pt-8 text-muted-foreground">{t('empty')}</p>
    </>
  )
}
