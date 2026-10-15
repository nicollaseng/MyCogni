import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { MoodMap } from '@/features/mood/components/mood-map'
import { SafetyNotice } from '@/features/safety/components/safety-notice'
import type { SafetyPrompt } from '@/features/safety/model'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'
import { StepActions } from '@/shared/components/step-actions'

interface DoneStepProps {
  valence: number
  recordedAt: string
  safety: SafetyPrompt | null
  summary: readonly string[]
}

export function DoneStep({ valence, recordedAt, safety, summary }: DoneStepProps) {
  const t = useTranslations('checkIn.done')

  return (
    <section className="flex min-h-0 flex-1 flex-col items-center text-center">
      <MoodMap
        valence={valence}
        className={cn('size-[132px]', safety === null ? 'mt-12' : 'mt-6 max-sm:size-[96px]')}
      />
      <h1 className="mt-7 font-serif text-[34px] leading-[1.08] tracking-[-0.02em]">
        {t('title', { time: recordedAt })}
      </h1>
      <p className="mt-4 max-w-[320px] text-[15px] leading-relaxed text-muted-foreground">
        {summary.join(' · ')}
      </p>
      {safety !== null && <SafetyNotice prompt={safety} className="mt-6 w-full" />}
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
