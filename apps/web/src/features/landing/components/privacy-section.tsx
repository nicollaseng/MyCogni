import { useTranslations } from 'next-intl'
import { privacyCommitments, sections } from '../content'
import { SectionHeading } from './section-heading'

export function PrivacySection() {
  const t = useTranslations('landing')
  const titleId = `${sections.privacy}-title`

  return (
    <section
      id={sections.privacy}
      aria-labelledby={titleId}
      className="scroll-mt-6 border-t border-rule py-20 sm:py-28"
    >
      <div className="grid gap-12 lg:grid-cols-2 lg:items-end lg:gap-20">
        <SectionHeading
          id={titleId}
          kicker={t('sections.privacy')}
          title={t('privacy.title')}
          description={t('privacy.description')}
        />
        <ul className="divide-y divide-rule border-y border-rule">
          {privacyCommitments.map((commitment) => (
            <li key={commitment} className="py-4 leading-relaxed">
              {t(`privacy.commitments.${commitment}`)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
