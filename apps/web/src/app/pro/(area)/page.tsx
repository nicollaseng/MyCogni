import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { requireProfessional } from '@/features/professional/access'
import { ActivityChart } from '@/features/professional/components/activity-chart'
import { AttentionList } from '@/features/professional/components/attention-list'
import { PlusIcon } from '@/features/professional/components/icons'
import { OverviewKpis } from '@/features/professional/components/overview-kpis'
import { RecentCheckIns } from '@/features/professional/components/recent-check-ins'
import { VerificationNotice } from '@/features/professional/components/verification-notice'
import {
  compactButton,
  EmptyState,
  quietButton,
  Surface,
  WorkspaceHeader,
  WorkspaceSection,
} from '@/features/professional/components/workspace'
import { attentionPatients, overviewKpis } from '@/features/professional/overview'
import { fetchPatients, fetchProfessionalOverview } from '@/shared/lib/api/care'
import { requireProfile } from '@/shared/lib/auth/session'
import { fetchMyPhotoUrl } from '@/shared/lib/photos'
import { settledValue } from '@/shared/lib/settled'
import { formatDayTitle } from '@/shared/lib/time'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('professional.meta')
  return { title: t('overview') }
}

const inviteHref = { pathname: '/pro/invites', query: { new: '1' } } as const

export default async function ProfessionalHomePage() {
  const [access, workspace] = await Promise.allSettled([
    Promise.all([requireProfessional(), requireProfile()]),
    Promise.all([
      fetchPatients(),
      fetchProfessionalOverview(),
      getTranslations('professional.overview'),
      getLocale(),
    ]),
  ])
  const [professional, { timezone }] = settledValue(access)
  if (professional.status !== 'verified') {
    return (
      <VerificationNotice
        professional={professional}
        timeZone={timezone}
        photoUrl={await fetchMyPhotoUrl()}
      />
    )
  }
  const [patients, overview, t, locale] = settledValue(workspace)
  const now = new Date()
  const flagged = attentionPatients(patients).length

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
      <OverviewKpis kpis={overviewKpis(patients, overview)} />
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
            title={t('attention.title')}
            action={
              flagged > 0 && (
                <Link
                  href={{ pathname: '/pro/patients', query: { filter: 'attention' } }}
                  className="text-sm text-muted-foreground underline decoration-1 underline-offset-4 transition-colors hover:text-foreground"
                >
                  {t('attention.seeAll', { count: flagged })}
                </Link>
              )
            }
          >
            <AttentionList patients={patients} now={now} timeZone={timezone} />
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
