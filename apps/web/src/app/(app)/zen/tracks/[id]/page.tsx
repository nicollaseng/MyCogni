import {
  contentLanguageOf,
  isTrackId,
  progressOf,
  stepMinutes,
  stepNarration,
  trackMinutes,
  trackText,
  tracks,
} from '@mycogni/domain'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { fetchNarrationManifest, narrationSources } from '@/features/audio/narration'
import { SafetyPanel } from '@/features/safety/components/safety-panel'
import { setStepDone } from '@/features/zen/actions'
import { ProgressLine } from '@/features/zen/components/progress-line'
import { TrackSteps } from '@/features/zen/components/track-steps'
import { meditationOptions } from '@/features/zen/meditation/options'
import { ZenTopBar } from '@/features/zen/components/zen-top-bar'
import { stepTitle } from '@/features/zen/titles'
import { fetchCareLinks } from '@/shared/lib/api/care'
import { fetchStepProgress } from '@/shared/lib/api/zen'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { linkedProfessionalsOf } from '@/shared/lib/emergency-contacts'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata({
  params,
}: PageProps<'/zen/tracks/[id]'>): Promise<Metadata> {
  const [{ id }, locale] = await Promise.all([params, getLocale()])
  return isTrackId(id) ? { title: trackText(contentLanguageOf(locale), id).title } : {}
}

export default async function ZenTrackPage({ params }: PageProps<'/zen/tracks/[id]'>) {
  const [[{ id }], [t, locale, doneSteps, careLinks, manifest]] = await guarded(
    Promise.all([params, requireOnboardedProfile()]),
    Promise.all([
      getTranslations('zen'),
      getLocale(),
      fetchStepProgress(),
      fetchCareLinks(),
      fetchNarrationManifest(),
    ]),
  )
  if (!isTrackId(id)) {
    notFound()
  }
  const language = contentLanguageOf(locale)
  const text = trackText(language, id)
  const progress = progressOf(id, doneSteps)
  const professionals = linkedProfessionalsOf(careLinks)
  const meditations = meditationOptions(manifest, language)

  return (
    <>
      <ZenTopBar />
      <header className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('track.kicker', { count: progress.total, minutes: trackMinutes(id, language) })}
        </p>
        <h1 className="font-serif text-[40px] leading-[1.04] tracking-[-0.02em] text-balance sm:text-5xl">
          {text.title}
        </h1>
        <p className="max-w-[36rem] leading-relaxed text-pretty text-muted-foreground">
          {text.summary}
        </p>
        <div className="max-w-[36rem] space-y-2 pt-1">
          <p className="text-sm">
            {progress.complete
              ? t('track.complete')
              : t('track.progress', { done: progress.done.length, total: progress.total })}
          </p>
          <ProgressLine done={progress.done.length} total={progress.total} />
        </div>
      </header>

      <TrackSteps
        trackId={id}
        steps={tracks[id].steps.map((step) => {
          const stepText = text.steps[step.id] ?? { title: step.id, body: '' }
          return {
            step,
            title: stepTitle(step, stepText, language),
            text: stepText,
            done: progress.done.includes(step.id),
            minutes: stepMinutes(step, language),
            narration:
              step.kind === 'meditate'
                ? []
                : narrationSources(manifest, language, stepNarration(stepText)),
            meditation:
              step.kind === 'meditate'
                ? (meditations.find((option) => option.id === step.meditation) ?? null)
                : null,
          }
        })}
        nextId={progress.next?.id ?? null}
        started={progress.started}
        support={<SafetyPanel level="watch" professionals={professionals} intro={false} />}
        save={setStepDone}
      />

      <p className="text-sm text-muted-foreground">{t('disclaimer')}</p>
    </>
  )
}
