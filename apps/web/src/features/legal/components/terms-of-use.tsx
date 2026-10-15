import type { Locale } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { termsSections } from '../content'
import { LegalPage } from './legal-page'

interface TermsOfUseProps {
  chooseLocale: (locale: Locale) => Promise<void>
}

export function TermsOfUse({ chooseLocale }: TermsOfUseProps) {
  const t = useTranslations('legal.terms')

  return (
    <LegalPage
      chooseLocale={chooseLocale}
      document={{
        title: t('title'),
        summary: t('summary'),
        sections: termsSections.map((key) => ({
          heading: t(`sections.${key}.heading`),
          body: t(`sections.${key}.body`),
        })),
      }}
    />
  )
}
