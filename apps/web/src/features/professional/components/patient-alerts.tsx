'use client'

import type { ProfessionalAlert } from '@mycogni/contracts'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import {
  ActionFeedback,
  AlertButtons,
  AlertLevelLabel,
  AlertStatusLabel,
  useAlertActions,
  type AlertActions,
} from './alert-cells'
import { table, TableScroll } from './data-table'
import { RelativeTime } from './patient-cells'
import { WorkspaceSection } from './workspace'

interface PatientAlertsProps extends AlertActions {
  alerts: readonly ProfessionalAlert[]
  name: string
  now: Date
  timeZone: string
}

export function PatientAlerts({
  alerts,
  name,
  now,
  timeZone,
  acknowledge,
  resolve,
}: PatientAlertsProps) {
  const t = useTranslations('alerts')
  const actions = useAlertActions({ acknowledge, resolve })
  if (alerts.length === 0 && actions.notice === null) {
    return null
  }

  return (
    <WorkspaceSection
      title={t('patient.title')}
      description={t('patient.description')}
      action={
        <Link
          href="/pro/alerts"
          className="text-sm text-muted-foreground underline decoration-1 underline-offset-4 transition-colors hover:text-foreground"
        >
          {t('patient.all')}
        </Link>
      }
    >
      <ActionFeedback state={actions} />
      {alerts.length > 0 && (
        <TableScroll label={t('title')}>
          <table className={cn(table.base, 'min-w-[640px]')}>
            <thead>
              <tr>
                <th scope="col" className={cn(table.head, table.headFirst)}>
                  {t('columns.reason')}
                </th>
                <th scope="col" className={table.head}>
                  {t('columns.level')}
                </th>
                <th scope="col" className={table.head}>
                  {t('columns.createdAt')}
                </th>
                <th scope="col" className={table.head}>
                  {t('columns.status')}
                </th>
                <th scope="col" className={cn(table.head, 'w-px text-right')}>
                  <span className="sr-only">{t('columns.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} className={table.row}>
                  <td className={cn(table.cell, table.first)}>{t(`reasons.${alert.reason}`)}</td>
                  <td className={table.cell}>
                    <AlertLevelLabel level={alert.level} />
                  </td>
                  <td className={cn(table.cell, 'whitespace-nowrap')}>
                    <RelativeTime date={alert.createdAt} now={now} timeZone={timeZone} />
                  </td>
                  <td className={table.cell}>
                    <AlertStatusLabel status={alert.status} />
                  </td>
                  <td className={cn(table.cell, 'py-2.5')}>
                    <AlertButtons alert={alert} name={name} state={actions} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}
    </WorkspaceSection>
  )
}
