import { progressOf, suggestedArticles, type DoneStep, type ZenSuggestion } from '@mycogni/domain'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Disclosure } from '@/shared/components/disclosure'
import { buttonVariants } from '@/shared/ui/button'
import { articles } from '../content/articles'
import { contentLanguageOf } from '../content/language'
import type { ContentLanguage } from '../content/types'
import { trackText } from '../content/tracks'
import { readingMinutes } from '../reading'
import { HelpLines } from './help-lines'
import { ProgressLine } from './progress-line'

interface ForYouProps {
  suggestion: ZenSuggestion
  doneSteps: readonly DoneStep[]
  professionals: readonly string[]
}

const textLink = 'underline decoration-1 underline-offset-4'

function HelpFirst({ professionals }: { professionals: readonly string[] }) {
  const t = useTranslations('zen.help')

  return (
    <div className="space-y-4 border-l-2 border-help pl-5">
      <h3 className="font-serif text-[24px] leading-tight tracking-[-0.01em]">{t('title')}</h3>
      <p className="leading-relaxed text-pretty">{t('body')}</p>
      <HelpLines />
      {professionals.map((name) => (
        <p key={name} className="leading-relaxed text-muted-foreground">
          {t('professional', { name })}
        </p>
      ))}
    </div>
  )
}

export function ForYou({ suggestion, doneSteps, professionals }: ForYouProps) {
  const t = useTranslations('zen.forYou')
  const minutes = useTranslations('zen.readings')
  const language = contentLanguageOf(useLocale())
  const [main, ...others] = suggestion.tracks
  const readings = suggestedArticles(suggestion.tracks, doneSteps, 2)

  return (
    <section aria-labelledby="zen-for-you" className="space-y-6">
      <h2 id="zen-for-you" className="text-[15px] font-medium">
        {t('title')}
      </h2>

      {suggestion.seekHelpFirst && <HelpFirst professionals={professionals} />}

      {main !== undefined && (
        <FeaturedTrack trackId={main} doneSteps={doneSteps} language={language} />
      )}

      {others.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t('also')}</p>
          <ul className="space-y-1.5">
            {others.map((id) => (
              <li key={id}>
                <Link href={`/zen/tracks/${id}`} className={textLink}>
                  {trackText(language, id).title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {readings.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t('readings')}</p>
          <ul className="space-y-3">
            {readings.map((id) => {
              const text = articles[id].text[language]
              return (
                <li key={id}>
                  <Link href={`/zen/articles/${id}`} className={textLink}>
                    {text.title}
                  </Link>
                  <span className="block text-sm text-muted-foreground">
                    {minutes('minutes', { minutes: readingMinutes(text) })}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <Disclosure
        buttonClassName="text-sm text-muted-foreground hover:text-foreground"
        panelClassName="pt-3"
        summary={<span className="underline decoration-1 underline-offset-4">{t('why')}</span>}
      >
        <div className="max-w-[36rem] space-y-3 text-sm leading-relaxed">
          <ul className="list-disc space-y-1.5 pl-5">
            {suggestion.reasons.map((reason) => (
              <li key={reason}>{t(`reasons.${reason}`)}</li>
            ))}
          </ul>
          <p className="text-muted-foreground">{t('rules')}</p>
        </div>
      </Disclosure>
    </section>
  )
}

interface FeaturedTrackProps {
  trackId: ZenSuggestion['tracks'][number]
  doneSteps: readonly DoneStep[]
  language: ContentLanguage
}

function FeaturedTrack({ trackId, doneSteps, language }: FeaturedTrackProps) {
  const t = useTranslations('zen.forYou')
  const text = trackText(language, trackId)
  const progress = progressOf(trackId, doneSteps)
  const action = progress.complete ? 'review' : progress.started ? 'continue' : 'start'

  return (
    <div className="space-y-4 rounded-lg bg-surface px-5 py-6 sm:px-7 sm:py-7">
      <p className="text-sm text-muted-foreground">
        {t('kicker')} · {t('progress', { done: progress.done.length, total: progress.total })}
      </p>
      <h3 className="font-serif text-[28px] leading-[1.1] tracking-[-0.015em] text-balance">
        {text.title}
      </h3>
      <p className="max-w-[34rem] leading-relaxed text-pretty text-muted-foreground">
        {text.summary}
      </p>
      <ProgressLine done={progress.done.length} total={progress.total} />
      <div className="pt-1">
        <Link href={`/zen/tracks/${trackId}`} className={buttonVariants()}>
          {t(action)}
        </Link>
      </div>
    </div>
  )
}
