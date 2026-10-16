import {
  articleIds,
  averageOf,
  contentLanguageOf,
  needsCrisisHelp,
  todayPick,
  trackIds,
  zenSuggestion,
} from '@mycogni/domain'
import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { SafetyPanel } from '@/features/safety/components/safety-panel'
import { latestByInstrument } from '@/features/screening/latest'
import { ReadingRows, TrackRows } from '@/features/zen/components/library'
import { TodayCard } from '@/features/zen/components/today-card'
import { TopicTiles } from '@/features/zen/components/topic-tiles'
import { PageTitle } from '@/shared/components/page-title'
import { fetchCareLinks } from '@/shared/lib/api/care'
import { fetchAssessments, fetchCheckInsSince } from '@/shared/lib/api/resources'
import { fetchStepProgress } from '@/shared/lib/api/zen'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('zen.meta')
  return { title: t('title') }
}

const moodWindowMs = 7 * 24 * 60 * 60 * 1000

export default async function ZenPage() {
  const now = new Date()
  const [, [t, locale, assessments, checkIns, doneSteps, careLinks]] = await guarded(
    requireOnboardedProfile(),
    Promise.all([
      getTranslations('zen'),
      getLocale(),
      fetchAssessments(),
      fetchCheckInsSince(new Date(now.getTime() - moodWindowMs)),
      fetchStepProgress(),
      fetchCareLinks(),
    ]),
  )
  const language = contentLanguageOf(locale)
  const suggestion = zenSuggestion({
    latest: Object.values(latestByInstrument(assessments)),
    moodAverage: averageOf(checkIns.map((checkIn) => checkIn.moodLevel)),
  })
  const professionals = careLinks.map((link) => link.professional.name)

  return (
    <>
      <PageTitle title={t('title')} />

      {needsCrisisHelp(suggestion) && <SafetyPanel level="urgent" professionals={professionals} />}

      <TodayCard
        pick={todayPick(suggestion.tracks, doneSteps)}
        language={language}
        reasons={suggestion.reasons}
      />

      <TopicTiles />

      <TrackRows
        ids={trackIds}
        doneSteps={doneSteps}
        language={language}
        title={t('library.tracks')}
      />

      <ReadingRows ids={articleIds} language={language} title={t('library.readings')} shown={4} />

      <p className="text-sm text-muted-foreground">{t('disclaimer')}</p>
    </>
  )
}
