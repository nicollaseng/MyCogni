import { averageOf, zenSuggestion } from '@mycogni/domain'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { LatestScreening } from '@/features/screening/components/latest-screening'
import { ScreeningSchedule } from '@/features/screening/components/screening-schedule'
import { latestByInstrument } from '@/features/screening/latest'
import { ArticleList } from '@/features/zen/components/article-list'
import { ForYou } from '@/features/zen/components/for-you'
import { TrackList } from '@/features/zen/components/track-list'
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
  const [{ timezone }, [t, assessments, checkIns, doneSteps, careLinks]] = await guarded(
    requireOnboardedProfile(),
    Promise.all([
      getTranslations('zen'),
      fetchAssessments(),
      fetchCheckInsSince(new Date(now.getTime() - moodWindowMs)),
      fetchStepProgress(),
      fetchCareLinks(),
    ]),
  )
  const latest = latestByInstrument(assessments)
  const suggestion = zenSuggestion({
    latest: Object.values(latest),
    moodAverage: averageOf(checkIns.map((checkIn) => checkIn.moodLevel)),
  })
  const lastAnswer = assessments[0]?.completedAt

  return (
    <>
      <PageTitle title={t('title')} description={t('description')} />

      <ForYou
        suggestion={suggestion}
        doneSteps={doneSteps}
        professionals={careLinks.map((link) => link.professional.name)}
      />

      <TrackList doneSteps={doneSteps} />

      <ArticleList />

      <LatestScreening results={latest} timeZone={timezone}>
        {lastAnswer !== undefined && (
          <ScreeningSchedule
            lastAnswer={lastAnswer}
            now={now}
            timeZone={timezone}
            offerRetake="always"
          />
        )}
      </LatestScreening>

      <p className="max-w-[36rem] border-l-2 border-rule pl-4 text-sm leading-relaxed text-muted-foreground">
        {t('disclaimer')}
      </p>
    </>
  )
}
