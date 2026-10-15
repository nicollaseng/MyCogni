import { isTrackId, progressOf, tracks } from '@mycogni/domain'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { setStepDone } from '@/features/zen/actions'
import { HelpLines } from '@/features/zen/components/help-lines'
import { ProgressLine } from '@/features/zen/components/progress-line'
import { TrackSteps } from '@/features/zen/components/track-steps'
import { contentLanguageOf } from '@/features/zen/content/language'
import { trackText } from '@/features/zen/content/tracks'
import { fetchCareLinks } from '@/shared/lib/api/care'
import { fetchStepProgress } from '@/shared/lib/api/zen'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata({
  params,
}: PageProps<'/zen/tracks/[id]'>): Promise<Metadata> {
  const [{ id }, locale] = await Promise.all([params, getLocale()])
  return isTrackId(id) ? { title: trackText(contentLanguageOf(locale), id).title } : {}
}

export default async function ZenTrackPage({ params }: PageProps<'/zen/tracks/[id]'>) {
  const [[{ id }], [t, locale, doneSteps, careLinks]] = await guarded(
    Promise.all([params, requireOnboardedProfile()]),
    Promise.all([getTranslations('zen'), getLocale(), fetchStepProgress(), fetchCareLinks()]),
  )
  if (!isTrackId(id)) {
    notFound()
  }
  const text = trackText(contentLanguageOf(locale), id)
  const progress = progressOf(id, doneSteps)
  const professionals = careLinks.map((link) => link.professional.name)

  return (
    <>
      <header className="space-y-4">
        <Link
          href="/zen"
          className="inline-block pb-2 text-sm text-muted-foreground hover:text-foreground"
        >
          ← {t('track.back')}
        </Link>
        <p className="text-sm text-muted-foreground">
          {t('track.kicker', { count: progress.total })}
        </p>
        <h1 className="font-serif text-[40px] leading-[1.04] tracking-[-0.02em] text-balance sm:text-5xl">
          {text.title}
        </h1>
        <p className="max-w-[36rem] leading-relaxed text-pretty text-muted-foreground">
          {text.summary}
        </p>
        <div className="max-w-[36rem] space-y-2 pt-2">
          <p className="text-sm">
            {t('track.progress', { done: progress.done.length, total: progress.total })}
          </p>
          <ProgressLine done={progress.done.length} total={progress.total} />
        </div>
      </header>

      <div className="-mx-5 sm:-mx-6">
        <TrackSteps
          trackId={id}
          steps={tracks[id].steps.map((step) => ({
            step,
            text: text.steps[step.id] ?? { title: step.id, body: '' },
            done: progress.done.includes(step.id),
          }))}
          nextId={progress.next?.id ?? null}
          support={
            <div className="space-y-3">
              <HelpLines />
              {professionals.map((name) => (
                <p key={name} className="leading-relaxed text-muted-foreground">
                  {t('help.professional', { name })}
                </p>
              ))}
            </div>
          }
          save={setStepDone}
        />
      </div>

      {progress.complete && <p className="leading-relaxed">{t('track.complete')}</p>}

      <p className="max-w-[36rem] border-l-2 border-rule pl-4 text-sm leading-relaxed text-muted-foreground">
        {t('disclaimer')}
      </p>
    </>
  )
}
