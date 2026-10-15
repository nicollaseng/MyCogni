import type { ProfessionalAlert } from '@mycogni/contracts'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Avatar } from '@/shared/components/avatar'
import { initialsOf } from '@/shared/lib/initials'
import { cn } from '@/shared/lib/utils'
import { AlertLevelLabel, AlertReasonLabel } from './alert-cells'
import { centeredTable as table, TableScroll } from './data-table'
import { RelativeTime } from './patient-cells'
import { Quiet } from './workspace'

const shown = 6

interface OverviewAlertsProps {
  alerts: readonly ProfessionalAlert[]
  now: Date
  timeZone: string
}

export function OverviewAlerts({ alerts, now, timeZone }: OverviewAlertsProps) {
  const t = useTranslations('alerts')

  if (alerts.length === 0) {
    return <Quiet>{t('overview.empty')}</Quiet>
  }

  return (
    <TableScroll label={t('title')}>
      <table className={cn(table.base, 'min-w-[620px]')}>
        <thead>
          <tr>
            <th scope="col" className={cn(table.head, table.headFirst, 'w-[30%]')}>
              {t('columns.patient')}
            </th>
            <th scope="col" className={table.head}>
              {t('columns.reason')}
            </th>
            <th scope="col" className={table.head}>
              {t('columns.level')}
            </th>
            <th scope="col" className={cn(table.head, 'w-[16%]')}>
              {t('columns.createdAt')}
            </th>
          </tr>
        </thead>
        <tbody>
          {alerts.slice(0, shown).map((alert) => (
            <tr key={alert.id} className={table.row}>
              <td className={cn(table.cell, table.first)}>
                <span className="flex items-center gap-3">
                  <Avatar
                    src={alert.patientPhotoUrl}
                    initials={initialsOf(alert.patientName)}
                    size="xs"
                    className="max-sm:hidden"
                  />
                  <Link
                    href={`/pro/patients/${alert.patientId}`}
                    className="font-medium whitespace-nowrap decoration-1 underline-offset-4 hover:underline"
                  >
                    {alert.patientName ?? t('unnamed')}
                  </Link>
                </span>
              </td>
              <td className={table.cell}>
                <AlertReasonLabel alert={alert} name={alert.patientName ?? t('unnamed')} />
              </td>
              <td className={table.cell}>
                <AlertLevelLabel level={alert.level} />
              </td>
              <td className={cn(table.cell, 'whitespace-nowrap text-muted-foreground')}>
                <RelativeTime date={alert.createdAt} now={now} timeZone={timeZone} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  )
}
