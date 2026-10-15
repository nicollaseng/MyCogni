import type { CheckInDetail } from '@mycogni/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useId, type ReactNode } from 'react'
import { useCatalogLabels } from '@/features/check-in/use-catalog-labels'
import { MoodMap } from '@/features/mood/components/mood-map'
import { isMoodLevel, moodKeyOf, valenceOf } from '@/features/mood/mood-levels'
import { bindShortWords } from '@/shared/lib/text'
import { formatDayTitle, formatTime } from '@/shared/lib/time'
import type { EntriesHref } from '../filters'

interface EntryDetailProps {
  checkIn: CheckInDetail
  timeZone: string
  back: { href: EntriesHref | `/pro/patients/${string}`; label: string }
  children: ReactNode
}

function TagList({ title, tags }: { title: string; tags: readonly string[] }) {
  const id = useId()
  if (tags.length === 0) {
    return null
  }
  return (
    <div className="space-y-1">
      <h2 id={id} className="text-sm text-muted-foreground">
        {title}
      </h2>
      <ul aria-labelledby={id} className="flex flex-wrap gap-x-2 text-[17px]">
        {tags.map((tag, index) => (
          <li key={tag} className="flex gap-x-2">
            {index > 0 && (
              <span aria-hidden className="text-muted-foreground">
                ·
              </span>
            )}
            {tag}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function EntryDetail({ checkIn, timeZone, back, children }: EntryDetailProps) {
  const t = useTranslations('entries.detail')
  const mood = useTranslations('common.mood')
  const locale = useLocale()
  const labels = useCatalogLabels()
  const recordedAt = new Date(checkIn.recordedAt)
  const level = isMoodLevel(checkIn.moodLevel) ? checkIn.moodLevel : 3
  const hasDetails =
    checkIn.emotions.length > 0 || checkIn.contexts.length > 0 || checkIn.note !== null

  return (
    <article className="space-y-8">
      <Link
        href={back.href}
        className="-ml-1 inline-flex h-10 items-center gap-1.5 pr-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg aria-hidden viewBox="0 0 16 16" className="size-4">
          <path
            d="M10 4l-4 4 4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {back.label}
      </Link>

      <header className="flex items-center gap-5 sm:gap-8">
        <MoodMap valence={valenceOf(level)} rings={9} className="size-28 shrink-0 sm:size-36" />
        <div className="min-w-0 space-y-1.5">
          <h1 className="font-serif text-[34px] leading-[1.08] tracking-[-0.02em] sm:text-[42px]">
            {mood(moodKeyOf(level))}
          </h1>
          <p className="text-muted-foreground">
            <time dateTime={checkIn.recordedAt}>
              <span className="block">{formatDayTitle(recordedAt, timeZone, locale)}</span>
              <span className="block">{formatTime(recordedAt, timeZone, locale)}</span>
            </time>
          </p>
        </div>
      </header>

      {hasDetails && (
        <div className="space-y-6">
          <TagList title={t('emotions')} tags={checkIn.emotions.map(labels.emotion)} />
          <TagList title={t('contexts')} tags={checkIn.contexts.map(labels.context)} />
          {checkIn.note !== null && (
            <div className="space-y-1">
              <h2 className="text-sm text-muted-foreground">{t('note')}</h2>
              <p className="font-serif text-[19px] leading-relaxed text-pretty whitespace-pre-line">
                {bindShortWords(checkIn.note)}
              </p>
            </div>
          )}
        </div>
      )}

      {children}
    </article>
  )
}
