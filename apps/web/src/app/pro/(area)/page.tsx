import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { refreshAfterUpload } from '@/features/account/actions'
import { requireProfessional } from '@/features/professional/access'
import { finishPhotoStep } from '@/features/professional/actions'
import { ActivityChart } from '@/features/professional/components/activity-chart'
import { PlusIcon } from '@/features/professional/components/icons'
import { OverviewAlerts } from '@/features/professional/components/overview-alerts'
import { OnboardingScreen } from '@/features/professional/components/onboarding-screen'
import { OverviewKpis } from '@/features/professional/components/overview-kpis'
import { RecentCheckIns } from '@/features/professional/components/recent-check-ins'
import {
  compactButton,
  EmptyState,
  quietButton,
  Surface,
  WorkspaceHeader,
  WorkspaceSection,
} from '@/features/professional/components/workspace'
import { pendingAlerts } from '@/features/professional/alert-table'
import { onboardingStepOf } from '@/features/professional/onboarding'
import { hasFinishedPhotoStep } from '@/features/professional/onboarding-state'
import { overviewKpis } from '@/features/professional/overview'
import { fetchAlerts } from '@/shared/lib/api/alerts'
import { fetchPatients, fetchProfessionalOverview } from '@/shared/lib/api/care'
import { requireProfile } from '@/shared/lib/auth/session'
import { fetchMyPhotoUrl } from '@/shared/lib/photos'
import { formatDayTitle } from '@/shared/lib/time'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('professional.meta')
  return { title: t('overview') }
}

const inviteHref = { pathname: '/pro/invites', query: { new: '1' } } as const

export default async function ProfessionalHomePage() {
  const [professional, { timezone }] = await Promise.all([requireProfessional(), requireProfile()])
  if (professional.status !== 'verified') {
    const [photoStepDone, photoUrl] = await Promise.all([hasFinishedPhotoStep(), fetchMyPhotoUrl()])
    return (
      <OnboardingScreen
        professional={professional}
        step={onboardingStepOf(professional, photoStepDone)}
        timeZone={timezone}
        photoUrl={photoUrl}
        actions={{ refresh: refreshAfterUpload, finishPhotoStep }}
      />
    )
  }
  const [patients, overview, alerts, t, alertText, locale] = await Promise.all([
    fetchPatients(),
    fetchProfessionalOverview(),
    fetchAlerts(),
    getTranslations('professional.overview'),
    getTranslations('alerts.overview'),
    getLocale(),
  ])
  const now = new Date()
  const pending = pendingAlerts(alerts)

  return (
    <>
      <WorkspaceHeader
        title={t('title')}
        description={formatDayTitle(now, timezone, locale)}
        actions={
          <Link href={inviteHref} className={compactButton}>
            <PlusIcon className="size-4" />
            {t('invite')}
          </Link>
        }
      />
      <OverviewKpis kpis={overviewKpis(patients, overview, alerts)} />
      {patients.length === 0 ? (
        <EmptyState
          title={t('empty.title')}
          action={
            <Link href={inviteHref} className={quietButton}>
              {t('empty.action')}
            </Link>
          }
        >
          {t('empty.body')}
        </EmptyState>
      ) : (
        <>
          <WorkspaceSection
            title={alertText('title')}
            action={
              <Link
                href="/pro/alerts"
                className="text-sm text-muted-foreground underline decoration-1 underline-offset-4 transition-colors hover:text-foreground"
              >
                {alertText('seeAll', { count: pending.length })}
              </Link>
            }
          >
            <OverviewAlerts alerts={pending} now={now} timeZone={timezone} />
          </WorkspaceSection>
          <div className="grid gap-x-8 gap-y-7 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <WorkspaceSection title={t('activity.title')} description={t('activity.description')}>
              <Surface className="px-3 pt-3 pb-2 sm:px-5 sm:pt-4">
                <ActivityChart activity={overview.activity} />
              </Surface>
            </WorkspaceSection>
            <WorkspaceSection title={t('recent.title')}>
              <RecentCheckIns entries={overview.recent} now={now} timeZone={timezone} />
            </WorkspaceSection>
          </div>
        </>
      )}
    </>
  )
}
