import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { MoodMap } from '@/features/mood/components/mood-map'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'
import { StepActions } from '@/shared/components/step-actions'

interface DoneStepProps {
  valence: number
  recordedAt: string
  summary: readonly string[]
}

export function DoneStep({ valence, recordedAt, summary }: DoneStepProps) {
  const t = useTranslations('checkIn.done')

  return (
    <section className="flex min-h-0 flex-1 flex-col items-center text-center">
      <MoodMap valence={valence} className="mt-12 size-[132px]" />
      <h1 className="mt-7 font-serif text-[34px] leading-[1.08] tracking-[-0.02em]">
        {t('title', { time: recordedAt })}
      </h1>
      <p className="mt-4 max-w-[320px] text-[15px] leading-relaxed text-muted-foreground">
        {summary.join(' · ')}
      </p>
      <StepActions className="w-full">
        <Link href="/today" className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
          {t('days')}
        </Link>
        <Link
          href="/entries"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mt-1 w-full')}
        >
          {t('entries')}
        </Link>
      </StepActions>
    </section>
  )
}
