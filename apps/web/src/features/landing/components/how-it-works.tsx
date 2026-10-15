import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { MoodMap } from '@/features/mood/components/mood-map'
import { MoodStrip } from '@/features/mood/components/mood-strip'
import { sampleFortnight, sections } from '../content'
import { QuestionnairePreview } from './questionnaire-preview'
import { SectionHeading } from './section-heading'

interface Step {
  key: 'record' | 'answer' | 'understand'
  visual: ReactNode
}

function SampleFortnight() {
  const t = useTranslations('landing.howItWorks.sample')

  return (
    <figure className="w-full">
      <MoodStrip days={sampleFortnight} label={t('label')} />
      <figcaption className="mt-3 text-xs text-muted-foreground">{t('caption')}</figcaption>
    </figure>
  )
}

const steps: readonly Step[] = [
  { key: 'record', visual: <MoodMap valence={0.35} rings={9} className="size-40" /> },
  { key: 'answer', visual: <QuestionnairePreview /> },
  { key: 'understand', visual: <SampleFortnight /> },
]

export function HowItWorks() {
  const t = useTranslations('landing')
  const titleId = `${sections.howItWorks}-title`

  return (
    <section
      id={sections.howItWorks}
      aria-labelledby={titleId}
      className="scroll-mt-6 border-t border-rule py-20 sm:py-28"
    >
      <SectionHeading
        id={titleId}
        kicker={t('sections.howItWorks')}
        title={t('howItWorks.title')}
      />
      <ol className="mt-14 grid gap-14 lg:grid-cols-3 lg:gap-12">
        {steps.map((step, index) => (
          <li key={step.key} className="flex flex-col">
            <div className="flex h-48 items-end">{step.visual}</div>
            <p className="mt-8 text-sm text-muted-foreground">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h3 className="mt-1 font-serif text-[26px] tracking-[-0.01em]">
              {t(`howItWorks.steps.${step.key}.title`)}
            </h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {t(`howItWorks.steps.${step.key}.description`)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
