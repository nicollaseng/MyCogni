import { useTranslations } from 'next-intl'
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
            <details key={key} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[17px] font-medium [&::-webkit-details-marker]:hidden">
                {t(`faq.questions.${key}.question`)}
                <span
                  aria-hidden
                  className="mt-0.5 text-xl leading-none font-normal text-muted-foreground transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
                {t(`faq.questions.${key}.answer`)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
