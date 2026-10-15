import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { addToEntry } from '@/features/entries/actions'
import { EntryAddenda } from '@/features/entries/components/entry-addenda'
import { EntryDetail } from '@/features/entries/components/entry-detail'
import { entriesHref, parseEntryFilters } from '@/features/entries/filters'
import { fetchCheckIn } from '@/shared/lib/api/resources'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('entries.meta')
  return { title: t('detail') }
}

export default async function EntryPage({ params, searchParams }: PageProps<'/entries/[id]'>) {
  const { timezone } = await requireOnboardedProfile()
  const [{ id }, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations('entries.detail'),
  ])
  const checkIn = await fetchCheckIn(id)
  if (checkIn === null) {
    notFound()
  }

  return (
    <EntryDetail
      checkIn={checkIn}
      timeZone={timezone}
      back={{ href: entriesHref(parseEntryFilters(query)), label: t('back') }}
    >
      <EntryAddenda
        addenda={checkIn.addenda}
        timeZone={timezone}
        append={addToEntry.bind(null, checkIn.id)}
      />
    </EntryDetail>
  )
}
