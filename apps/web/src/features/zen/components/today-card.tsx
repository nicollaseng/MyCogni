import {
  stepMinutes,
  trackText,
  tracks,
  type ContentLanguage,
  type SuggestionReason,
  type TodayPick,
} from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'
import { hasStepAction } from '../model'
import { stepTitle } from '../titles'
import { BreatheRing } from './breathe-ring'
import { SoundNow } from './sound-now'
import { StepAction } from './step-action'
import { WhySuggestion } from './why-suggestion'
import { ZenContour } from './zen-contour'

interface TodayCardProps {
  title: string
  pick: TodayPick | null
  language: ContentLanguage
  reasons: readonly SuggestionReason[]
  night?: boolean
}

function TodayStep({ pick, language }: { pick: TodayPick; language: ContentLanguage }) {
  const t = useTranslations('zen')
  const track = trackText(language, pick.trackId)
  const steps = tracks[pick.trackId].steps
  const text = track.steps[pick.step.id] ?? { title: pick.step.id, body: '' }
  const title = stepTitle(pick.step, text, language)
  const label = pick.started ? t('today.continue') : t('today.start')

  return (
    <>
      <p className="text-sm text-zen-foreground/75">
        {t('today.kicker', {
          track: track.title,
          step: steps.indexOf(pick.step) + 1,
          total: steps.length,
        })}
      </p>
      <div className="space-y-2.5">
        <h3 className="font-serif text-[32px] leading-[1.05] tracking-[-0.02em] text-balance sm:text-[40px]">
          {title}
        </h3>
        <p className="text-sm text-zen-foreground/75">
          {t(`kinds.${pick.step.kind}`)} ·{' '}
          {t('minutes', { minutes: stepMinutes(pick.step, language) })}
        </p>
      </div>
      <div className="pt-2">
        {hasStepAction(pick.step) ? (
          <StepAction step={pick.step} text={text} primary inverse label={label} />
        ) : (
          <Link
            href={`/zen/tracks/${pick.trackId}#step-${pick.step.id}`}
            className={buttonVariants({ variant: 'inverse' })}
          >
            {label}
          </Link>
        )}
      </div>
    </>
  )
}

export function TodayCard({ title, pick, language, reasons, night = false }: TodayCardProps) {
  const t = useTranslations('zen')

  return (
    <section
      aria-labelledby="zen-today"
      className={cn('space-y-4', night && 'space-y-6')}
      data-night={night || undefined}
    >
      {night && <BreatheRing />}
      <div
        data-testid="zen-card"
        className="on-zen relative overflow-hidden rounded-lg bg-zen px-6 pt-5 pb-8 sm:px-9 sm:pt-7 sm:pb-11"
      >
        <ZenContour
          rings={7}
          calm={0.9}
          className="absolute -right-28 -bottom-40 size-[380px] animate-zen-swell text-zen-line opacity-70 motion-reduce:animate-none sm:-right-16 sm:-bottom-36 sm:size-[460px]"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <h1 className="font-serif text-[28px] leading-none tracking-[-0.02em] sm:text-[32px]">
            {title}
          </h1>
          <SoundNow />
        </div>
        <div className="relative mt-12 max-w-[28rem] space-y-4 sm:mt-16">
          <h2
            id="zen-today"
            className="text-[13px] font-medium tracking-[0.08em] text-zen-foreground/80 uppercase"
          >
            {t('today.title')}
          </h2>
          {pick === null ? (
            <p className="leading-relaxed text-pretty">{t('today.allDone')}</p>
          ) : (
            <TodayStep pick={pick} language={language} />
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        {!night && <BreatheRing />}
        <WhySuggestion reasons={reasons} />
      </div>
    </section>
  )
}
