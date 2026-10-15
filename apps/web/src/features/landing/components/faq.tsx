import { useTranslations } from 'next-intl'
import { Disclosure } from '@/shared/components/disclosure'
import { questions, sections } from '../content'
import { SectionHeading } from './section-heading'

export function Faq() {
  const t = useTranslations('landing')
  const titleId = `${sections.faq}-title`

  return (
    <section
      id={sections.faq}
      aria-labelledby={titleId}
      className="scroll-mt-6 border-t border-rule py-20 sm:py-28"
    >
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <SectionHeading id={titleId} kicker={t('sections.faq')} title={t('faq.title')} />
        <div className="divide-y divide-rule border-y border-rule">
          {questions.map((key) => (
            <Disclosure
              key={key}
              className="py-5"
              buttonClassName="w-full justify-between gap-6 text-[17px] font-medium"
              panelClassName="pt-3"
              keepMounted
              summary={t(`faq.questions.${key}.question`)}
            >
              <p className="max-w-xl leading-relaxed text-muted-foreground">
                {t(`faq.questions.${key}.answer`)}
              </p>
            </Disclosure>
          ))}
        </div>
      </div>
    </section>
  )
}
