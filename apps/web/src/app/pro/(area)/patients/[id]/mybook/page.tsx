import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Icon } from '@/features/mybook/components/icon'
import { PageList } from '@/features/mybook/components/page-list'
import { groupByMonth } from '@/features/mybook/months'
import { requireVerifiedProfessional } from '@/features/professional/access'
import { PageTitle } from '@/shared/components/page-title'
import { fetchPatient } from '@/shared/lib/api/care'
import { fetchSharedJournal } from '@/shared/lib/api/journal'
import { requireProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mybook.meta')
  return { title: t('shared') }
}

const listSize = 100

export default async function PatientMybookPage({
  params,
}: PageProps<'/pro/patients/[id]/mybook'>) {
  await requireVerifiedProfessional()
  const { id } = await params
  const [patient, { timezone }, t] = await Promise.all([
    fetchPatient(id),
    requireProfile(),
    getTranslations('mybook.professional'),
  ])
  if (patient === null) {
    notFound()
  }
  const pages = await fetchSharedJournal(patient.id, { limit: listSize })
  if (pages === null) {
    notFound()
  }
  const now = new Date()

  return (
    <>
      <div className="space-y-6">
        <Link
          href={`/pro/patients/${patient.id}`}
          className="-ml-1 inline-flex h-10 items-center gap-1 pr-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon name="back" />
          {t('back')}
        </Link>
        <PageTitle
          kicker={t('kicker', { name: patient.name ?? t('unnamed') })}
          title={t('title')}
          description={t('lead')}
        />
      </div>

      {pages.length === 0 ? (
        <section aria-labelledby="shared-empty" className="max-w-[36rem] space-y-2">
          <h2 id="shared-empty" className="font-serif text-[23px] leading-snug">
            {t('empty.title')}
          </h2>
          <p className="leading-relaxed text-muted-foreground">{t('empty.body')}</p>
        </section>
      ) : (
        <div className="max-w-3xl">
          <PageList
            groups={groupByMonth(pages, timezone)}
            now={now}
            timeZone={timezone}
            hrefOf={(entryId) => `/pro/patients/${patient.id}/mybook/${entryId}`}
          />
        </div>
      )}
    </>
  )
}
