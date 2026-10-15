import type { Locale } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { privacySections } from '../content'
import { LegalPage } from './legal-page'

interface PrivacyPolicyProps {
  chooseLocale: (locale: Locale) => Promise<void>
}

export function PrivacyPolicy({ chooseLocale }: PrivacyPolicyProps) {
  const t = useTranslations('legal.privacy')

  return (
    <LegalPage
      chooseLocale={chooseLocale}
      document={{
        title: t('title'),
        summary: t('summary'),
        sections: privacySections.map((key) => ({
          heading: t(`sections.${key}.heading`),
          body: t(`sections.${key}.body`),
        })),
      }}
    />
  )
}
