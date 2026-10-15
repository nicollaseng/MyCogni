import {
  contentLanguageOf,
  readingMinutes,
  trackIds,
  trackText,
  tracks,
  zenArticles,
  type ArticleId,
} from '@mycogni/domain'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { HelpLines } from './help-lines'

const textLink = 'underline decoration-1 underline-offset-4'

function hostOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '')
}

export function ArticleView({ id }: { id: ArticleId }) {
  const t = useTranslations('zen')
  const language = contentLanguageOf(useLocale())
  const text = zenArticles[id].text[language]
  const { references } = zenArticles[id]
  const inTracks = trackIds.filter((trackId) =>
    tracks[trackId].steps.some((step) => step.kind === 'read' && step.article === id),
  )

  return (
    <article className="space-y-10">
      <header className="space-y-4">
        <Link
          href="/zen"
          className="inline-block pb-2 text-sm text-muted-foreground hover:text-foreground"
        >
          ← {t('article.back')}
        </Link>
        <p className="text-sm text-muted-foreground">
          {t('article.kicker', { minutes: readingMinutes(text) })}
        </p>
        <h1 className="font-serif text-[38px] leading-[1.06] tracking-[-0.02em] text-balance sm:text-5xl">
          {text.title}
        </h1>
        <p className="max-w-[38rem] text-lg leading-relaxed text-pretty text-muted-foreground">
          {text.summary}
        </p>
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
      </div>

      <p className="max-w-[38rem] border-l-2 border-rule pl-4 text-sm leading-relaxed text-muted-foreground">
        {t('disclaimer')}
      </p>

      {id === 'when-to-seek-help' && (
        <section aria-labelledby="article-help" className="max-w-[38rem] space-y-3">
          <h2 id="article-help" className="text-[15px] font-medium">
            {t('article.helpTitle')}
          </h2>
          <HelpLines />
        </section>
      )}

      <section aria-labelledby="article-references" className="max-w-[38rem] space-y-3">
        <h2 id="article-references" className="text-[15px] font-medium">
          {t('article.references')}
        </h2>
        <ol className="list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground">
          {references.map((reference) => (
            <li key={reference.url} className="pl-1 break-words">
              {reference.citation}{' '}
              <a href={reference.url} target="_blank" rel="noreferrer" className={textLink}>
                {hostOf(reference.url)}
              </a>
            </li>
          ))}
        </ol>
      </section>

      {inTracks.length > 0 && (
        <section aria-labelledby="article-tracks" className="space-y-2">
          <h2 id="article-tracks" className="text-[15px] font-medium">
            {t('article.inTracks')}
          </h2>
          <ul className="space-y-1.5">
            {inTracks.map((trackId) => (
              <li key={trackId}>
                <Link href={`/zen/tracks/${trackId}`} className={textLink}>
                  {trackText(language, trackId).title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
