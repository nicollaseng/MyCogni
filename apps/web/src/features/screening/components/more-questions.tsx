import type { FullFormStart } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { StepActions } from '@/shared/components/step-actions'
import { StepHeading } from '@/shared/components/step-heading'
import { Button } from '@/shared/ui/button'

export function MoreQuestions({
  start,
  onContinue,
}: {
  start: FullFormStart
  onContinue: () => void
}) {
  const t = useTranslations('screening.more')

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="mt-10">
        <StepHeading title={t(`title.${start.domain}`)}>
          {t('body', { count: start.count })}
        </StepHeading>
      </div>
      <StepActions>
        <Button size="lg" onClick={onContinue}>
          {t('continue')}
        </Button>
      </StepActions>
    </section>
  )
}
