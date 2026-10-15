import { historySince, insightLookbackDays, patternPeriodOf } from '@mycogni/domain'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PatternsOverview } from '@/features/patterns/components/patterns-overview'
import { buildPatterns } from '@/features/patterns/model'
import { ReportExport } from '@/features/reports/components/report-export'
import { PageTitle } from '@/shared/components/page-title'
import {
  countCheckIns,
  fetchAssessments,
  fetchCheckInsSince,
  fetchConsents,
  fetchInsights,
} from '@/shared/lib/api/resources'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('patterns.meta')
  return { title: t('title') }
}

const dayInMs = 24 * 60 * 60 * 1000

async function patternsOf(searchParams: PageProps<'/patterns'>['searchParams'], now: Date) {
  const { period: requested } = await searchParams
  const period = patternPeriodOf(Array.isArray(requested) ? requested[0] : requested)
  const [t, checkIns, assessments, readings, consents, totalCheckIns, recentCheckIns] =
    await Promise.all([
      getTranslations('patterns'),
      fetchCheckInsSince(historySince(period, now)),
      fetchAssessments(),
      fetchInsights(),
      fetchConsents(),
      countCheckIns({}),
      countCheckIns({ since: new Date(now.getTime() - insightLookbackDays * dayInMs) }),
    ])
  return {
    t,
    period,
    checkIns,
    assessments,
    readings,
    totalCheckIns,
    recentCheckIns,
    summariesEnabled: consents.some((consent) => consent.kind === 'ai_processing'),
  }
}

export default async function PatternsPage({ searchParams }: PageProps<'/patterns'>) {
  const now = new Date()
  const [{ timezone }, { t, ...input }] = await guarded(
    requireOnboardedProfile(),
    patternsOf(searchParams, now),
  )
  const model = buildPatterns({ ...input, timeZone: timezone, now })

  return (
    <>
      <PageTitle
        title={t('title')}
        description={t('description')}
        action={
          input.totalCheckIns > 0 ? (
            <ReportExport
              href="/patterns/report"
              audience="patient"
              summaries={input.readings.length > 0}
            />
          ) : undefined
        }
      />
      <PatternsOverview model={model} timeZone={timezone} />
    </>
  )
}
