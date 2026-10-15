import type {
  CareLink,
  CreateJournalShareInput,
  JournalAccess,
  JournalEntrySummary,
  JournalShare,
} from '@mycogni/contracts'
import { useLocale, useTranslations } from 'next-intl'
import { Panel } from '@/shared/components/section'
import type { ActionResult } from '@/shared/lib/actions/result'
import { cn } from '@/shared/lib/utils'
import { formatDay } from '../dates'
import { isLive, shareStateOf, type ShareState } from '../sharing'
import { Icon } from './icon'
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
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm',
        state.kind === 'none' ? 'bg-background/70 text-muted-foreground' : 'bg-sage',
      )}
    >
      {state.kind === 'none' ? (
        <Icon name="lock" className="size-4" />
      ) : (
        <span aria-hidden className="size-2 rounded-full bg-emphasis" />
      )}
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
    <section aria-label={name}>
      <Panel className="space-y-5 px-4 py-5 sm:px-6">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="font-serif text-[23px] leading-tight tracking-[-0.01em]">{name}</h2>
            <p className="text-sm text-muted-foreground">{kinds(link.professional.kind)}</p>
          </div>
          <ShareStateLabel state={shareStateOf(shares, now)} now={now} timeZone={timeZone} />
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

        {live.length > 0 && (
          <div className="space-y-2">
            <h3 className="px-1 text-sm text-muted-foreground">{t('shares.active')}</h3>
            <ul className="space-y-2">{live.map((item) => record(item, revoke))}</ul>
          </div>
        )}

        {past.length > 0 && (
          <details className="group">
            <summary className="w-fit cursor-pointer list-none px-1 text-sm text-muted-foreground underline decoration-1 underline-offset-4 [&::-webkit-details-marker]:hidden">
              {t('shares.history')} ({past.length})
            </summary>
            <ul className="mt-3 space-y-2">{past.map((item) => record(item, null))}</ul>
          </details>
        )}
      </Panel>
    </section>
  )
}
