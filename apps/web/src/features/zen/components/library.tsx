import {
  progressOf,
  readingMinutes,
  trackMinutes,
  trackText,
  zenArticles,
  type ArticleId,
  type ContentLanguage,
  type DoneStep,
  type TrackId,
} from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Disclosure } from '@/shared/components/disclosure'
import { trackStatusOf } from '../model'
import { ProgressRing } from './progress-ring'
import { ReadingIcon } from './topic-icon'

const rowStyles =
  'flex min-h-14 items-center gap-3.5 rounded-md px-3 py-3 transition-colors duration-150 hover:bg-sage motion-reduce:transition-none'

const headingStyles = 'font-serif text-[26px] leading-tight tracking-[-0.01em]'

interface TrackRowsProps {
  ids: readonly TrackId[]
  doneSteps: readonly DoneStep[]
  language: ContentLanguage
  title: string
}

export function TrackRows({ ids, doneSteps, language, title }: TrackRowsProps) {
  const t = useTranslations('zen')

  return (
    <section aria-label={title} className="space-y-4">
      <h2 className={headingStyles}>{title}</h2>
      <ul className="rounded-lg bg-surface p-2">
        {ids.map((id) => {
          const progress = progressOf(id, doneSteps)
          const status = trackStatusOf(progress)
          return (
            <li key={id}>
              <Link href={`/zen/tracks/${id}`} className={rowStyles}>
                <ProgressRing done={progress.done.length} total={progress.total} />
                <span className="min-w-0 flex-1 text-pretty">{trackText(language, id).title}</span>
                <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                  {status === 'new'
                    ? t('minutes', { minutes: trackMinutes(id, language) })
                    : t(`status.${status}`, {
                        done: progress.done.length,
                        total: progress.total,
                      })}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

interface ReadingRowsProps {
  ids: readonly ArticleId[]
  language: ContentLanguage
  title: string
  shown?: number
}

function ReadingList({ ids, language }: Pick<ReadingRowsProps, 'ids' | 'language'>) {
  const t = useTranslations('zen')

  return (
    <ul>
      {ids.map((id) => {
        const text = zenArticles[id].text[language]
        return (
          <li key={id}>
            <Link href={`/zen/articles/${id}`} className={rowStyles}>
              <ReadingIcon className="text-emphasis" />
              <span className="min-w-0 flex-1 text-pretty">{text.title}</span>
              <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                {t('minutes', { minutes: readingMinutes(text) })}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export function ReadingRows({ ids, language, title, shown = ids.length }: ReadingRowsProps) {
  const t = useTranslations('zen.library')
  const rest = ids.slice(shown)

  return (
    <section aria-label={title} className="space-y-4">
      <h2 className={headingStyles}>{title}</h2>
      <div className="rounded-lg bg-surface p-2">
        <ReadingList ids={ids.slice(0, shown)} language={language} />
        {rest.length > 0 && (
          <Disclosure
            buttonClassName="min-h-12 w-full px-3 text-sm text-muted-foreground hover:text-foreground"
            summary={<span>{t('more', { count: rest.length })}</span>}
          >
            <ReadingList ids={rest} language={language} />
          </Disclosure>
        )}
      </div>
    </section>
  )
}
