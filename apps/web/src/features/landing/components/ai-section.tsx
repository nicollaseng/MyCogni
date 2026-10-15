import { useTranslations } from 'next-intl'
import { aiPrinciples, sections } from '../content'
import { SectionHeading } from './section-heading'
import { WeeklyNote } from './weekly-note'

export function AiSection() {
  const t = useTranslations('landing')
  const titleId = `${sections.ai}-title`

  return (
    <section
      id={sections.ai}
      aria-labelledby={titleId}
      className="scroll-mt-6 border-t border-rule py-20 sm:py-28"
    >
      <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-20">
        <div>
          <SectionHeading
            id={titleId}
            kicker={t('sections.ai')}
            title={t('ai.title')}
            description={t('ai.description')}
          />
          <ul className="mt-10 divide-y divide-rule border-y border-rule">
            {aiPrinciples.map((principle) => (
              <li key={principle} className="py-4 leading-relaxed">
                {t(`ai.principles.${principle}`)}
              </li>
            ))}
          </ul>
        </div>
        <WeeklyNote />
      </div>
    </section>
  )
}
