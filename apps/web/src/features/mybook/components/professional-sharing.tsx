import type {
  CareLink,
  CreateJournalShareInput,
  JournalAccess,
  JournalEntrySummary,
  JournalShare,
} from '@mycogni/contracts'
import { useLocale, useTranslations } from 'next-intl'
import type { ActionResult } from '@/shared/lib/actions/result'
import { cn } from '@/shared/lib/utils'
import { formatDay } from '../dates'
import { isLive, shareStateOf, type ShareState } from '../sharing'
import { ShareFlow } from './share-flow'
import { ShareRecord } from './share-record'

interface ProfessionalSharingProps {
  link: CareLink
  shares: readonly JournalShare[]
  access: Readonly<Record<string, readonly JournalAccess[]>>
  pages: readonly JournalEntrySummary[]
  preselected: readonly string[]
  initiallyOpen: boolean
  now: Date
  timeZone: string
  share: (input: CreateJournalShareInput) => Promise<ActionResult<null>>
  revoke: (id: string) => Promise<ActionResult<null>>
}

export function ShareStateLabel({
  state,
  now,
  timeZone,
}: {
  state: ShareState
  now: Date
  timeZone: string
}) {
  const t = useTranslations('mybook.sharing.state')
  const locale = useLocale()

  function label(): string {
    switch (state.kind) {
      case 'none':
        return t('none')
      case 'entries':
        return t('entries', { count: state.count })
      case 'all':
        return state.until === null
          ? t('allForever')
          : t('allUntil', { date: formatDay(state.until, now, timeZone, locale) })
    }
  }

  return (
    <p
      className={cn(
        'flex items-center gap-2 text-sm',
        state.kind === 'none' ? 'text-muted-foreground' : 'text-foreground',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-2 shrink-0 rounded-full',
          state.kind === 'none' ? 'bg-muted-foreground/45' : 'bg-emphasis',
        )}
      />
      {label()}
    </p>
  )
}

export function ProfessionalSharing({
  link,
  shares,
  access,
  pages,
  preselected,
  initiallyOpen,
  now,
  timeZone,
  share,
  revoke,
}: ProfessionalSharingProps) {
  const t = useTranslations('mybook.sharing')
  const kinds = useTranslations('common.professionalKinds')
  const titles = new Map(pages.map((page) => [page.id, page.title]))
  const live = shares.filter((candidate) => isLive(candidate, now))
  const past = shares.filter((candidate) => !isLive(candidate, now))
  const name = link.professional.name
  const record = (item: JournalShare, revokeShare: typeof revoke | null) => (
    <ShareRecord
      key={item.id}
      share={item}
      name={name}
      access={access[item.id] ?? []}
      titles={titles}
      now={now}
      timeZone={timeZone}
      revoke={revokeShare}
    />
  )

  return (
    <section aria-label={name} className="space-y-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1">
          <h2 className="font-serif text-[24px] leading-tight tracking-[-0.01em]">{name}</h2>
          <p className="text-sm text-muted-foreground">{kinds(link.professional.kind)}</p>
          <div className="pt-2">
            <ShareStateLabel state={shareStateOf(shares, now)} now={now} timeZone={timeZone} />
          </div>
        </div>
        <ShareFlow
          careLinkId={link.id}
          name={name}
          pages={pages}
          preselected={preselected}
          initiallyOpen={initiallyOpen}
          hasShares={live.length > 0}
          now={now.toISOString()}
          timeZone={timeZone}
          share={share}
        />
      </div>

      {live.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">{t('shares.active')}</h3>
          <ul className="space-y-6">{live.map((item) => record(item, revoke))}</ul>
        </div>
      )}

      {past.length > 0 && (
        <details className="group space-y-4">
          <summary className="w-fit cursor-pointer list-none text-sm text-muted-foreground underline decoration-1 underline-offset-4 [&::-webkit-details-marker]:hidden">
            {t('shares.history')} ({past.length})
          </summary>
          <ul className="space-y-6 pt-4">{past.map((item) => record(item, null))}</ul>
        </details>
      )}
    </section>
  )
}
