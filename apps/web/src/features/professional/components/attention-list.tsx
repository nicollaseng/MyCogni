import type { PatientSummary } from '@mycogni/contracts'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { attentionPatients } from '../overview'
import { table, TableScroll } from './data-table'
import { AttentionReasons, RelativeTime } from './patient-cells'
import { Quiet } from './workspace'

const shown = 6

interface AttentionListProps {
  patients: readonly PatientSummary[]
  now: Date
  timeZone: string
}

export function AttentionList({ patients, now, timeZone }: AttentionListProps) {
  const t = useTranslations('professional')
  const flagged = attentionPatients(patients).slice(0, shown)

  if (flagged.length === 0) {
    return <Quiet>{t('overview.attention.empty')}</Quiet>
  }

  return (
    <TableScroll label={t('overview.attention.title')}>
      <table className={cn(table.base, 'min-w-[560px]')}>
        <thead>
          <tr>
            <th scope="col" className={cn(table.head, table.headFirst, 'w-[30%]')}>
              {t('overview.attention.patient')}
            </th>
            <th scope="col" className={table.head}>
              {t('overview.attention.reasons')}
            </th>
            <th scope="col" className={cn(table.head, 'w-[22%]')}>
              {t('overview.attention.lastCheckIn')}
            </th>
          </tr>
        </thead>
        <tbody>
          {flagged.map((patient) => (
            <tr key={patient.linkId} className={table.row}>
              <td className={cn(table.cell, table.first)}>
                <Link
                  href={`/pro/patients/${patient.id}`}
                  className="font-medium decoration-1 underline-offset-4 hover:underline"
                >
                  {patient.name ?? t('patients.unnamed')}
                </Link>
              </td>
              <td className={table.cell}>
                <AttentionReasons reasons={patient.attention} />
              </td>
              <td className={cn(table.cell, 'whitespace-nowrap text-muted-foreground')}>
                {patient.lastCheckIn === null ? (
                  t('patients.noCheckIn')
                ) : (
                  <RelativeTime
                    date={patient.lastCheckIn.recordedAt}
                    now={now}
                    timeZone={timeZone}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  )
}
