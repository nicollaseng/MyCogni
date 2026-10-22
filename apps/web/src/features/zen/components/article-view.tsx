import {
  contentLanguageOf,
  trackIds,
  trackText,
  tracks,
  zenArticles,
  readingMinutes,
  type ArticleId,
} from '@mycogni/domain'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { NarrationPlayer } from '@/features/audio/components/narration-player'
import type { NarrationSource } from '@/features/audio/narration'
import { firstSentence } from '@/features/insights/readings'
import { SafetyPanel } from '@/features/safety/components/safety-panel'
import { Disclosure } from '@/shared/components/disclosure'
import { ShareRow } from './share-row'

const textLink = 'underline decoration-1 underline-offset-4'

function hostOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '')
}

interface ArticleViewProps {
  id: ArticleId
  narration?: readonly NarrationSource[]
  shareUrl?: string
  showTracks?: boolean
  ending?: ReactNode
}

export function ArticleView({
  id,
  narration = [],
  shareUrl,
  showTracks = true,
  ending,
}: ArticleViewProps) {
  const t = useTranslations('zen')
  const locale = useLocale()
  const language = contentLanguageOf(locale)
  const text = zenArticles[id].text[language]
  const { references } = zenArticles[id]
  const inTracks = showTracks
    ? trackIds.filter((trackId) =>
        tracks[trackId].steps.some((step) => step.kind === 'read' && step.article === id),
      )
    : []

  return (
    <article className="space-y-10">
      <header className="space-y-5">
        <p className="text-sm text-muted-foreground">
          {t('article.kicker', { minutes: readingMinutes(text) })}
        </p>
        <h1 className="font-serif text-[38px] leading-[1.06] tracking-[-0.02em] text-balance sm:text-5xl">
          {text.title}
        </h1>
        <p className="max-w-[38rem] text-lg leading-relaxed text-pretty text-muted-foreground">
          {text.summary}
        </p>
        {(narration.length > 0 || shareUrl !== undefined) && (
          <div className="flex max-w-[38rem] flex-wrap items-center gap-x-4 gap-y-3">
            {narration.length > 0 && <NarrationPlayer sources={narration} title={text.title} />}
            {shareUrl !== undefined && (
              <ShareRow
                title={text.title}
                lead={text.summary}
                teaser={firstSentence(text.summary, locale)}
                url={shareUrl}
              />
            )}
          </div>
        )}
      </header>

      <div className="max-w-[38rem] space-y-9">
        {text.sections.map((section, index) => (
          <section key={section.heading ?? index} className="space-y-4">
            {section.heading !== undefined && (
              <h2 className="font-serif text-[25px] leading-tight tracking-[-0.01em] text-balance">
                {section.heading}
              </h2>
            )}
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-[17px] leading-[1.7] text-pretty">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
        {ending}
      </div>

      {id === 'when-to-seek-help' && (
        <SafetyPanel level="watch" professionals={[]} className="max-w-[38rem]" />
      )}

      <div className="max-w-[38rem] space-y-5">
        {inTracks.length > 0 && (
          <p className="text-[15px]">
            <span className="text-muted-foreground">{t('article.partOf')}: </span>
            {inTracks.map((trackId, index) => (
              <span key={trackId}>
                {index > 0 && ', '}
                <Link href={`/zen/tracks/${trackId}`} className={textLink}>
                  {trackText(language, trackId).title}
                </Link>
              </span>
            ))}
          </p>
        )}
        <Disclosure
          buttonClassName="min-h-10 text-[15px] font-medium"
          panelClassName="pt-3"
          summary={t('article.sources')}
        >
          <ol
            aria-label={t('article.sources')}
            className="list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground"
          >
            {references.map((reference) => (
              <li key={reference.url} className="pl-1 break-words">
                {reference.citation}{' '}
                <a href={reference.url} target="_blank" rel="noreferrer" className={textLink}>
                  {hostOf(reference.url)}
                </a>
              </li>
            ))}
          </ol>
        </Disclosure>
        <p className="text-sm text-muted-foreground">{t('disclaimer')}</p>
      </div>
    </article>
  )
}
