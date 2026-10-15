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
import { buttonVariants } from '@/shared/ui/button'
import { BreatheButton } from './breathe-button'
import { hasStepAction } from '../model'
import { stepTitle } from '../titles'
import { StepAction } from './step-action'
import { WhySuggestion } from './why-suggestion'

interface TodayCardProps {
  pick: TodayPick | null
  language: ContentLanguage
  reasons: readonly SuggestionReason[]
}

function TodayStep({ pick, language }: { pick: TodayPick; language: ContentLanguage }) {
  const t = useTranslations('zen')
  const track = trackText(language, pick.trackId)
  const steps = tracks[pick.trackId].steps
  const text = track.steps[pick.step.id] ?? { title: pick.step.id, body: '' }
  const title = stepTitle(pick.step, text, language)
  const label = pick.started ? t('today.continue') : t('today.start')

  return (
    <div className="space-y-5 rounded-lg bg-surface px-5 py-6 sm:px-7 sm:py-7">
      <p className="text-sm text-muted-foreground">
        {t('today.kicker', {
          track: track.title,
          step: steps.indexOf(pick.step) + 1,
          total: steps.length,
        })}
      </p>
      <div className="space-y-1.5">
        <h3 className="font-serif text-[28px] leading-[1.1] tracking-[-0.015em] text-balance">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t(`kinds.${pick.step.kind}`)} ·{' '}
          {t('minutes', { minutes: stepMinutes(pick.step, language) })}
        </p>
      </div>
      {hasStepAction(pick.step) ? (
        <StepAction step={pick.step} text={text} primary label={label} />
      ) : (
        <Link
          href={`/zen/tracks/${pick.trackId}#step-${pick.step.id}`}
          className={buttonVariants()}
        >
          {label}
        </Link>
      )}
    </div>
  )
}

export function TodayCard({ pick, language, reasons }: TodayCardProps) {
  const t = useTranslations('zen')

  return (
    <section aria-labelledby="zen-today" className="space-y-3">
      <h2 id="zen-today" className="text-[15px] font-medium">
        {t('today.title')}
      </h2>
      {pick === null ? (
        <p className="max-w-[36rem] leading-relaxed text-pretty">{t('today.allDone')}</p>
      ) : (
        <TodayStep pick={pick} language={language} />
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-1">
        <BreatheButton label={t('quickBreathe')} />
        <WhySuggestion reasons={reasons} />
      </div>
    </section>
  )
}
