import type { SectionStatus } from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Panel, Section } from '@/shared/components/section'

function Progress({ status }: { status: SectionStatus }) {
  const t = useTranslations('patterns.upcoming')

  if (status.state === 'progress') {
    return (
      <span className="flex shrink-0 items-center gap-2.5 text-sm text-muted-foreground">
        <span aria-hidden className="block h-1.5 w-12 rounded-xs bg-foreground/[0.08]">
          <span
            className="block h-full rounded-xs bg-emphasis"
            style={{ width: `${String((status.current / status.required) * 100)}%` }}
          />
        </span>
        {t(`progress.${status.unit}`, { current: status.current, required: status.required })}
      </span>
    )
  }
  if (status.state === 'blocked' && status.reason === 'disabled') {
    return (
      <span className="shrink-0 text-sm text-muted-foreground">
        {t('disabled')} ·{' '}
        <Link href="/me" className="text-foreground underline decoration-1 underline-offset-4">
          {t('enable')}
        </Link>
      </span>
    )
  }
  return <span className="shrink-0 text-sm text-muted-foreground">{t('contexts')}</span>
}

export function UpcomingList({ statuses }: { statuses: readonly SectionStatus[] }) {
  const t = useTranslations('patterns.upcoming')

  return (
    <Section title={t('title')}>
      <Panel className="py-4">
        <ul className="space-y-3.5">
          {statuses.map((status) => (
            <li
              key={status.section}
              data-section={status.section}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1"
            >
              <span className="text-[15px]">{t(`sections.${status.section}`)}</span>
              <Progress status={status} />
            </li>
          ))}
        </ul>
      </Panel>
    </Section>
  )
}
