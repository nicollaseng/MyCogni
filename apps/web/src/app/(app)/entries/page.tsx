import type { Metadata } from 'next'
import Link from 'next/link'
import { EntryList } from '@/features/entries/components/entry-list'
import { groupByDay } from '@/features/entries/group-by-day'
import { PageTitle } from '@/shared/components/page-title'
import { fetchCheckIns } from '@/shared/lib/api/resources'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'

export const metadata: Metadata = { title: 'Registros' }

const pageSize = 50

export default async function EntriesPage({ searchParams }: PageProps<'/entries'>) {
  const { timezone } = await requireOnboardedProfile()
  const { before } = await searchParams
  const checkIns = await fetchCheckIns({
    before: typeof before === 'string' ? before : undefined,
    limit: pageSize,
  })
  const oldest = checkIns.at(-1)

  return (
    <>
      <PageTitle
        title="Registros"
        description="Cada check-in fica guardado aqui, com a data, o humor e o que você quiser anotar."
      />
      {checkIns.length === 0 ? (
        <p className="border-t border-rule pt-8 text-muted-foreground">
          Seu primeiro registro aparece aqui.
        </p>
      ) : (
        <EntryList
          groups={groupByDay(checkIns, { timeZone: timezone, now: new Date() })}
          timeZone={timezone}
        />
      )}
      {checkIns.length === pageSize && oldest !== undefined && (
        <Link
          href={{ pathname: '/entries', query: { before: oldest.recordedAt } }}
          className="text-sm underline decoration-1 underline-offset-4"
        >
          Registros anteriores
        </Link>
      )}
    </>
  )
}
