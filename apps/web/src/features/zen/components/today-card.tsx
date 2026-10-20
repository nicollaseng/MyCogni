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
import { StepAction } from './step-action'
import { WhySuggestion } from './why-suggestion'
import { ZenContour } from './zen-contour'

interface TodayCardProps {
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
    <div className="relative overflow-hidden rounded-lg bg-zen px-6 py-7 text-zen-foreground sm:px-9 sm:py-10">
      <ZenContour
        rings={7}
        calm={0.9}
        drift={false}
        className="absolute -right-24 -bottom-36 size-[320px] text-zen-line opacity-70 sm:-right-10 sm:-bottom-28 sm:size-[360px]"
      />
      <div className="relative max-w-[28rem] space-y-6">
        <p className="text-sm text-zen-foreground/75">
          {t('today.kicker', {
            track: track.title,
            step: steps.indexOf(pick.step) + 1,
            total: steps.length,
          })}
        </p>
        <div className="space-y-2.5">
          <h3 className="font-serif text-[32px] leading-[1.05] tracking-[-0.02em] text-balance sm:text-[38px]">
            {title}
          </h3>
          <p className="text-sm text-zen-foreground/75">
            {t(`kinds.${pick.step.kind}`)} ·{' '}
            {t('minutes', { minutes: stepMinutes(pick.step, language) })}
          </p>
        </div>
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
    </div>
  )
}

export function TodayCard({ pick, language, reasons, night = false }: TodayCardProps) {
  const t = useTranslations('zen')

  return (
    <section aria-labelledby="zen-today" className="space-y-4" data-night={night || undefined}>
      {night && <BreatheRing />}
      <h2
        id="zen-today"
        className={cn('font-serif text-[26px] leading-tight tracking-[-0.01em]', night && 'pt-6')}
      >
        {t('today.title')}
      </h2>
      {pick === null ? (
        <p className="max-w-[36rem] leading-relaxed text-pretty">{t('today.allDone')}</p>
      ) : (
        <TodayStep pick={pick} language={language} />
      )}
      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        {!night && <BreatheRing />}
        <WhySuggestion reasons={reasons} />
      </div>
    </section>
  )
}
