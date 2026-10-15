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
  const format = useFormatter()

  const attentionCaption =
    kpis.risk > 0
      ? t('risk', { count: kpis.risk })
      : kpis.attention > 0
        ? t('ofPatients', { count: kpis.patients })
        : t('calm')

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
        label={t('attention')}
        value={format.number(kpis.attention)}
        tone={kpis.attention > 0 ? 'warn' : 'default'}
        caption={attentionCaption}
      />
      <Stat
        label={t('invitations')}
        value={format.number(kpis.pendingInvitations)}
        caption={t('expiring', { count: kpis.expiringSoon })}
      />
    </StatStrip>
  )
}
