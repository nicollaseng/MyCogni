import type { JournalAccess, JournalShare } from '@mycogni/contracts'
import { useLocale, useTranslations } from 'next-intl'
import type { ActionResult } from '@/shared/lib/actions/result'
import { formatDay, formatMoment } from '../dates'
import { isLive } from '../sharing'
import { RevokeShare } from './revoke-share'

const recentReads = 3

interface ShareRecordProps {
  share: JournalShare
  name: string
  access: readonly JournalAccess[]
  titles: ReadonlyMap<string, string | null>
  now: Date
  timeZone: string
  revoke: ((id: string) => Promise<ActionResult<null>>) | null
  showName?: boolean
}

function AccessLog({ access, timeZone }: { access: readonly JournalAccess[]; timeZone: string }) {
  const t = useTranslations('mybook')
  const locale = useLocale()
  if (access.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('sharing.access.none')}</p>
  }
  const line = (read: JournalAccess) => (
    <li key={`${read.entryId}-${read.accessedAt}`}>
      {t('sharing.access.opened', {
        title: read.entryTitle ?? t('untitled'),
        date: formatMoment(new Date(read.accessedAt), timeZone, locale),
      })}
    </li>
  )
  const older = access.slice(recentReads)

  return (
    <div className="space-y-1.5 text-sm">
      <ul className="space-y-1">{access.slice(0, recentReads).map(line)}</ul>
      {older.length > 0 && (
        <details className="group">
          <summary className="w-fit cursor-pointer list-none text-muted-foreground underline decoration-1 underline-offset-4 group-open:mb-1 [&::-webkit-details-marker]:hidden">
            {t('sharing.access.more', { count: access.length })}
          </summary>
          <ul className="space-y-1">{older.map(line)}</ul>
        </details>
      )}
    </div>
  )
}

export function ShareRecord({
  share,
  name,
  access,
  titles,
  now,
  timeZone,
  revoke,
  showName = false,
}: ShareRecordProps) {
  const t = useTranslations('mybook')
  const locale = useLocale()
  const day = (value: string) => formatDay(new Date(value), now, timeZone, locale)
  const live = isLive(share, now)
  const ending = share.revokedAt ?? share.expiresAt
  const period = live
    ? [
        t('sharing.shares.since', { date: day(share.createdAt) }),
        share.expiresAt === null
          ? t('sharing.shares.forever')
          : t('sharing.shares.until', { date: day(share.expiresAt) }),
      ].join(' · ')
    : ending === null
      ? null
      : t(share.revokedAt === null ? 'sharing.shares.expired' : 'sharing.shares.revoked', {
          date: day(ending),
        })
  const pageTitles = share.entryIds
    .filter((entryId) => titles.has(entryId))
    .map((entryId) => titles.get(entryId) ?? t('untitled'))

  return (
    <li className="space-y-2.5 rounded-[16px] bg-background/60 px-4 py-3.5">
      <div className="space-y-0.5">
        {showName && <p className="font-serif text-[19px] leading-snug">{name}</p>}
        <p className="font-medium">
          {share.scope === 'all'
            ? t('sharing.shares.all')
            : t('sharing.shares.entries', { count: share.entryIds.length })}
        </p>
        {period !== null && <p className="text-sm text-muted-foreground">{period}</p>}
        {pageTitles.length > 0 && (
          <p className="text-sm text-muted-foreground">{pageTitles.join(', ')}</p>
        )}
      </div>
      <AccessLog access={access} timeZone={timeZone} />
      {live && revoke !== null && <RevokeShare id={share.id} name={name} revoke={revoke} />}
    </li>
  )
}
