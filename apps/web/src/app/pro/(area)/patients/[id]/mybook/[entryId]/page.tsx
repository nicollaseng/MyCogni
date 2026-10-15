import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { Icon } from '@/features/mybook/components/icon'
import { formatWritten } from '@/features/mybook/dates'
import { JournalViewer } from '@/features/mybook/editor/journal-viewer'
import { requireVerifiedProfessional } from '@/features/professional/access'
import { fetchPatient } from '@/shared/lib/api/care'
import { fetchSharedJournalEntry } from '@/shared/lib/api/journal'
import { requireProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mybook.meta')
  return { title: t('shared') }
}

export default async function SharedPagePage({
  params,
}: PageProps<'/pro/patients/[id]/mybook/[entryId]'>) {
  await requireVerifiedProfessional()
  const { id, entryId } = await params
  const [patient, { timezone }, t, book, locale] = await Promise.all([
    fetchPatient(id),
    requireProfile(),
    getTranslations('mybook.professional'),
    getTranslations('mybook'),
    getLocale(),
  ])
  if (patient === null) {
    notFound()
  }
  const entry = await fetchSharedJournalEntry(patient.id, entryId)
  if (entry === null) {
    notFound()
  }

  return (
    <article className="max-w-3xl space-y-8">
      <Link
        href={`/pro/patients/${patient.id}/mybook`}
        className="-ml-1 inline-flex h-10 items-center gap-1 pr-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon name="back" />
        {t('backToList')}
      </Link>
      <header className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t('kicker', { name: patient.name ?? t('unnamed') })}
        </p>
        <h1 className="font-serif text-[34px] leading-[1.1] tracking-[-0.02em] text-pretty sm:text-[42px]">
          {entry.title ?? book('untitled')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('written', { date: formatWritten(new Date(entry.createdAt), timezone, locale) })}
        </p>
      </header>
      <JournalViewer body={entry.body} imageUrls={entry.imageUrls} />
      <p className="text-sm text-muted-foreground">{t('readNotice')}</p>
    </article>
  )
}
