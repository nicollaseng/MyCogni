import { useFormatter, useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import type { OverviewKpis as Kpis } from '../overview'
import { TrendIcon } from './icons'
import { Stat, StatStrip } from './stat-tile'

function CheckInChange({ current, previous }: { current: number; previous: number }) {
  const t = useTranslations('professional.overview.kpis')
  const change = current - previous
  if (change === 0) {
    return <>{t('same')}</>
  }
  const direction = change > 0 ? 'up' : 'down'
  return (
    <span className="inline-flex items-start gap-1">
      <TrendIcon
        direction={direction}
        className={cn('mt-[3px]', direction === 'up' ? 'text-emphasis' : 'text-muted-foreground')}
      />
      {t(direction === 'up' ? 'more' : 'fewer', { count: Math.abs(change) })}
    </span>
  )
}

export function OverviewKpis({ kpis }: { kpis: Kpis }) {
  const t = useTranslations('professional.overview.kpis')
  const alerts = useTranslations('alerts.kpis')
  const format = useFormatter()

  return (
    <StatStrip label={t('label')}>
      <Stat
        label={t('patients')}
        value={format.number(kpis.patients)}
        caption={
          kpis.engagement === null
            ? t('noPatients')
            : t('engagement', { percent: format.number(kpis.engagement, { style: 'percent' }) })
        }
      />
      <Stat
        label={t('checkIns')}
        value={format.number(kpis.checkIns)}
        caption={<CheckInChange current={kpis.checkIns} previous={kpis.previousCheckIns} />}
      />
      <Stat
        label={alerts('label')}
        value={format.number(kpis.pendingAlerts)}
        tone={kpis.pendingAlerts > 0 ? 'warn' : 'default'}
        caption={
          kpis.pendingAlerts > 0 ? alerts('urgent', { count: kpis.urgentAlerts }) : alerts('calm')
        }
      />
      <Stat
        label={t('invitations')}
        value={format.number(kpis.pendingInvitations)}
        caption={t('expiring', { count: kpis.expiringSoon })}
      />
    </StatStrip>
  )
}
