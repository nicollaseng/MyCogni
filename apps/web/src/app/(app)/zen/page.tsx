import {
  articleIds,
  contentLanguageOf,
  isNight,
  needsCrisisHelp,
  practiceDays,
  practiceMap,
  practiceMapWeeks,
  practiceTotals,
  recentRecords,
  recordWindowDays,
  todayPick,
  trackIds,
  windowStart,
  zenSuggestion,
} from '@mycogni/domain'
import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { fetchNarrationManifest } from '@/features/audio/narration'
import { SafetyPanel } from '@/features/safety/components/safety-panel'
import { latestByInstrument } from '@/features/screening/latest'
import { ReadingRows, TrackRows } from '@/features/zen/components/library'
import { TodayCard } from '@/features/zen/components/today-card'
import { TopicTiles } from '@/features/zen/components/topic-tiles'
import { MeditationCards } from '@/features/zen/meditation/meditation-cards'
import { meditationOptions } from '@/features/zen/meditation/options'
import { PracticeSummary } from '@/features/zen/practice/practice-summary'
import { practiceSince, toPracticeSessions } from '@/features/zen/practice/sessions'
import { SoundCards } from '@/features/zen/sounds/sound-cards'
import { fetchCareLinks } from '@/shared/lib/api/care'
import { fetchAssessments, fetchCheckInsSince } from '@/shared/lib/api/resources'
import { fetchStepProgress, fetchZenSessions } from '@/shared/lib/api/zen'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { linkedProfessionalsOf } from '@/shared/lib/emergency-contacts'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('zen.meta')
  return { title: t('title') }
}

export default async function ZenPage() {
  const now = new Date()
  const [
    { timezone },
    [t, locale, assessments, checkIns, doneSteps, careLinks, manifest, sessions],
  ] = await guarded(
    requireOnboardedProfile(),
    Promise.all([
      getTranslations('zen'),
      getLocale(),
      fetchAssessments(),
      fetchCheckInsSince(windowStart(now, recordWindowDays)),
      fetchStepProgress(),
      fetchCareLinks(),
      fetchNarrationManifest(),
      fetchZenSessions(practiceSince(now, practiceMapWeeks.summary)),
    ]),
  )
  const language = contentLanguageOf(locale)
  const night = isNight(now, timezone)
  const suggestion = zenSuggestion({
    latest: Object.values(latestByInstrument(assessments)),
    ...recentRecords(checkIns, now),
    night,
  })
  const professionals = linkedProfessionalsOf(careLinks)
  const practice = toPracticeSessions(sessions)
  const days = practiceMap(practice, { now, timeZone: timezone, weeks: practiceMapWeeks.summary })

  return (
    <div className="space-y-14">
      <div className="space-y-4">
        {needsCrisisHelp(suggestion) && (
          <SafetyPanel level="urgent" professionals={professionals} />
        )}
        <TodayCard
          title={t('title')}
          pick={todayPick(suggestion.tracks, doneSteps)}
          language={language}
          reasons={suggestion.reasons}
          night={night && suggestion.reasons.includes('night')}
        />
      </div>

      <TopicTiles />

      <MeditationCards options={meditationOptions(manifest, language)} />

      <SoundCards />

      <PracticeSummary
        week={practiceTotals(practice, { now, timeZone: timezone }).week}
        days={days}
        practisedDays={practiceDays(days)}
        weeks={practiceMapWeeks.summary}
      />

      <TrackRows
        ids={trackIds}
        doneSteps={doneSteps}
        language={language}
        title={t('library.tracks')}
      />

      <ReadingRows ids={articleIds} language={language} title={t('library.readings')} shown={4} />

      <p className="text-sm text-muted-foreground">{t('disclaimer')}</p>
    </div>
  )
}
