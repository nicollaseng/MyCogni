import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { deletePage, savePage } from '@/features/mybook/actions'
import { JournalEditor } from '@/features/mybook/editor/journal-editor'
import { fetchJournalEntry } from '@/shared/lib/api/journal'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mybook.meta')
  return { title: t('page') }
}

export default async function MybookEntryPage({ params }: PageProps<'/mybook/[id]'>) {
  const { timezone } = await requireOnboardedProfile()
  const { id } = await params
  const entry = await fetchJournalEntry(id)
  if (entry === null) {
    notFound()
  }

  return (
    <JournalEditor
      key={entry.id}
      entry={entry}
      timeZone={timezone}
      save={savePage}
      remove={deletePage}
    />
  )
}
