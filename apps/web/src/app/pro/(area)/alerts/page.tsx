import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { requireVerifiedProfessional } from '@/features/professional/access'
import { acknowledgeAlert, resolveAlert } from '@/features/professional/alert-actions'
import { AlertsTable } from '@/features/professional/components/alerts-table'
import { WorkspaceHeader } from '@/features/professional/components/workspace'
import { fetchAlerts } from '@/shared/lib/api/alerts'
import { requireProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('alerts.meta')
  return { title: t('title') }
}

export default async function ProfessionalAlertsPage() {
  await requireVerifiedProfessional()
  const [{ timezone }, alerts, t] = await Promise.all([
    requireProfile(),
    fetchAlerts(),
    getTranslations('alerts'),
  ])

  return (
    <>
      <WorkspaceHeader title={t('title')} description={t('description')} />
      <AlertsTable
        alerts={alerts}
        now={new Date()}
        timeZone={timezone}
        acknowledge={acknowledgeAlert}
        resolve={resolveAlert}
      />
    </>
  )
}
