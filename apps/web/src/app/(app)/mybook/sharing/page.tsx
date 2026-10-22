import type { JournalAccess, JournalShare } from '@mycogni/contracts'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { revokeShare, shareJournal } from '@/features/mybook/actions'
import { Icon } from '@/features/mybook/components/icon'
import { ProfessionalSharing } from '@/features/mybook/components/professional-sharing'
import { ShareRecord } from '@/features/mybook/components/share-record'
import { PageTitle } from '@/shared/components/page-title'
import { Section } from '@/shared/components/section'
import { fetchCareLinks } from '@/shared/lib/api/care'
import { fetchJournal, fetchJournalAccess, fetchJournalShares } from '@/shared/lib/api/journal'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mybook.meta')
  return { title: t('sharing') }
}

const pickerSize = 100

async function accessLogs(
  shares: readonly JournalShare[],
): Promise<Record<string, readonly JournalAccess[]>> {
  const read = shares.filter((share) => share.lastAccessAt !== null)
  const logs = await Promise.all(read.map((share) => fetchJournalAccess(share.id)))
  return Object.fromEntries(read.map((share, index) => [share.id, logs[index] ?? []]))
}

export default async function MybookSharingPage({ searchParams }: PageProps<'/mybook/sharing'>) {
  const { timezone } = await requireOnboardedProfile()
  const { page } = await searchParams
  const [links, shares, { items: pages }, t] = await Promise.all([
    fetchCareLinks(),
    fetchJournalShares(),
    fetchJournal({ size: pickerSize }),
    getTranslations('mybook.sharing'),
  ])
  const access = await accessLogs(shares)
  const now = new Date()
  const preselected =
    typeof page === 'string' && pages.some((candidate) => candidate.id === page) ? [page] : []
  const linked = new Set(links.map((link) => link.id))
  const ended = shares.filter((share) => !linked.has(share.careLinkId))
  const titles = new Map(pages.map((candidate) => [candidate.id, candidate.title]))

  return (
    <>
      <div className="space-y-6">
        <Link
          href="/mybook"
          className="-ml-1 inline-flex h-10 items-center gap-1 pr-2 text-[15px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon name="back" />
          {t('back')}
        </Link>
        <PageTitle title={t('title')} description={t('description')} />
      </div>

      {links.length === 0 ? (
        <div className="max-w-[36rem] space-y-3">
          <p className="leading-relaxed text-muted-foreground">{t('noLinks')}</p>
          <Link href="/invites" className="inline-block underline decoration-1 underline-offset-4">
            {t('invites')}
          </Link>
        </div>
      ) : (
        <div className="space-y-14">
          {links.map((link) => (
            <ProfessionalSharing
              key={link.id}
              link={link}
              shares={shares.filter((share) => share.careLinkId === link.id)}
              access={access}
              pages={pages}
              preselected={preselected}
              initiallyOpen={preselected.length > 0 && links.length === 1}
              now={now}
              timeZone={timezone}
              share={shareJournal}
              revoke={revokeShare}
            />
          ))}
        </div>
      )}

      {ended.length > 0 && (
        <Section title={t('shares.ended')}>
          <ul className="space-y-6 pt-1">
            {ended.map((share) => (
              <ShareRecord
                key={share.id}
                share={share}
                name={share.professional.name}
                access={access[share.id] ?? []}
                titles={titles}
                now={now}
                timeZone={timezone}
                revoke={null}
                showName
              />
            ))}
          </ul>
        </Section>
      )}
    </>
  )
}
