import { contentLanguageOf, progressOf, trackIds, trackText, type DoneStep } from '@mycogni/domain'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { trackStatusOf } from '../model'
import { StatusDot } from './status-dot'

const rowStyles =
  'block rounded-lg px-5 py-4 transition-colors duration-150 hover:bg-surface motion-reduce:transition-none'

export function TrackList({ doneSteps }: { doneSteps: readonly DoneStep[] }) {
  const t = useTranslations('zen.tracks')
  const language = contentLanguageOf(useLocale())

  return (
    <section aria-labelledby="zen-tracks" className="space-y-2">
      <h2 id="zen-tracks" className="text-[15px] font-medium">
        {t('title')}
      </h2>
      <ul className="-mx-5">
        {trackIds.map((id) => {
          const text = trackText(language, id)
          const progress = progressOf(id, doneSteps)
          const status = trackStatusOf(progress)
          return (
            <li key={id}>
              <Link href={`/zen/tracks/${id}`} className={rowStyles}>
                <span className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">{text.title}</span>
                  <span className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                    <StatusDot status={status} />
                    {t(`status.${status}`, { done: progress.done.length, total: progress.total })}
                  </span>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-pretty text-muted-foreground">
                  {text.summary}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
