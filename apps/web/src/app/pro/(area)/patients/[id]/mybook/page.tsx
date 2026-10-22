import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Icon } from '@/features/mybook/components/icon'
import { PageList } from '@/features/mybook/components/page-list'
import { groupByMonth } from '@/features/mybook/months'
import { requireVerifiedProfessional } from '@/features/professional/access'
import { ListPager } from '@/shared/components/list-pager'
import { PageTitle } from '@/shared/components/page-title'
import { fetchPatient } from '@/shared/lib/api/care'
import { fetchSharedJournal } from '@/shared/lib/api/journal'
import { requireProfile } from '@/shared/lib/auth/session'
import { listPageOf, listPageQuery, withQuery } from '@/shared/lib/list-page'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mybook.meta')
  return { title: t('shared') }
}

export default async function PatientMybookPage({
  params,
  searchParams,
}: PageProps<'/pro/patients/[id]/mybook'>) {
  await requireVerifiedProfessional()
  const [{ id }, query] = await Promise.all([params, searchParams])
  const { page, size } = listPageOf(query)
  const [patient, { timezone }, t] = await Promise.all([
    fetchPatient(id),
    requireProfile(),
    getTranslations('mybook.professional'),
  ])
  if (patient === null) {
    notFound()
  }
  const shared = await fetchSharedJournal(patient.id, { page, size })
  if (shared === null) {
    notFound()
  }
  const now = new Date()
  const listPath = `/pro/patients/${patient.id}/mybook` as const

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

      {shared.items.length === 0 ? (
        <section aria-labelledby="shared-empty" className="max-w-[36rem] space-y-2">
          <h2 id="shared-empty" className="font-serif text-[23px] leading-snug">
            {t('empty.title')}
          </h2>
          <p className="leading-relaxed text-muted-foreground">{t('empty.body')}</p>
        </section>
      ) : (
        <div className="max-w-3xl space-y-8">
          <PageList
            groups={groupByMonth(shared.items, timezone)}
            now={now}
            timeZone={timezone}
            hrefOf={(entryId) => `/pro/patients/${patient.id}/mybook/${entryId}`}
          />
          <ListPager
            page={shared.page}
            size={size}
            total={shared.total}
            hrefOf={(target) => withQuery(listPath, listPageQuery(target))}
          />
        </div>
      )}
    </>
  )
}
