import type { QuestionnaireRun } from '@mycogni/contracts'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ActionError } from '@/shared/components/action-error'
import { StepActions } from '@/shared/components/step-actions'
import { StepHeading } from '@/shared/components/step-heading'
import { cn } from '@/shared/lib/utils'
import { Button, buttonVariants } from '@/shared/ui/button'

interface RunIntroProps {
  run: QuestionnaireRun
  starting: boolean
  error: string | null
  onStart: () => void
}

export function RunIntro({ run, starting, error, onStart }: RunIntroProps) {
  const t = useTranslations('questionnaires')

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none]">
      <StepHeading title={t(`areas.${run.area}`)}>
        {t('size', { count: run.itemCount, minutes: run.minutes })}
      </StepHeading>
      {run.note !== null && (
        <figure className="mt-7 border-l-2 border-rule pl-4">
          <figcaption className="text-sm text-muted-foreground">
            {t('intro.message', { name: run.professional.name })}
          </figcaption>
          <blockquote className="mt-1.5 font-serif text-[19px] leading-[1.45] text-pretty">
            {run.note}
          </blockquote>
        </figure>
      )}
      <p className="mt-7 rounded-lg bg-surface px-5 py-4 text-[15px] leading-relaxed text-pretty">
        {t('intro.notice')}
      </p>
      <p className="mt-4 text-sm text-muted-foreground">{t('intro.pause')}</p>
      <StepActions className="gap-3">
        <ActionError error={error} />
        <Button size="lg" onClick={onStart} disabled={starting}>
          {t('intro.start')}
        </Button>
        <Link
          href="/today"
          className={cn(buttonVariants({ size: 'lg', variant: 'ghost' }), 'w-full')}
        >
          {t('intro.later')}
        </Link>
      </StepActions>
    </section>
  )
}
