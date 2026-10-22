import type { PlainQuestionnaireSummaryView } from '@mycogni/contracts'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { StepActions } from '@/shared/components/step-actions'
import { StepHeading } from '@/shared/components/step-heading'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'
import { PlainSummary } from './plain-summary'

export function RunSummary({ summary }: { summary: PlainQuestionnaireSummaryView }) {
  const t = useTranslations('questionnaires.summary')

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none]">
      <StepHeading title={t('title')} />
      <div className="mt-7">
        <PlainSummary summary={summary} />
      </div>
      <p className="mt-7 text-[15px] font-medium">{t('talk')}</p>
      <StepActions>
        <p className="mb-3 text-center text-sm text-balance text-muted-foreground">
          {t('notDiagnosis')}
        </p>
        <Link href="/today" className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
          {t('today')}
        </Link>
        <Link
          href="/me/questionnaires"
          className="mt-4 self-center text-[15px] underline decoration-1 underline-offset-4"
        >
          {t('list')}
        </Link>
      </StepActions>
    </section>
  )
}
