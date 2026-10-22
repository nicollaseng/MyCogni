import type { ZenContentStats } from '@mycogni/contracts'
import {
  articleIds,
  breathingContentId,
  contentLanguageOf,
  isSoundProgrammeId,
  meditationIds,
  soundProgrammeIds,
  trackIds,
  trackText,
  type PracticeKind,
} from '@mycogni/domain'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ZenStatsTable, type ZenStatsRow } from '@/features/admin/components/zen-stats-table'
import { WorkspaceHeader } from '@/features/professional/components/workspace'
import { practiceTitle, type PracticeTitles } from '@/features/zen/practice/titles'
import { fetchZenStats } from '@/shared/lib/api/zen'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.zen')
  return { title: t('title') }
}

const catalog: readonly (readonly [PracticeKind, readonly string[]])[] = [
  ['meditation', meditationIds],
  ['sound', soundProgrammeIds],
  ['breathing', [breathingContentId]],
  ['reading', articleIds],
]

export default async function AdminZenPage() {
  const [stats, t, zen, locale] = await Promise.all([
    fetchZenStats(),
    getTranslations('admin.zen'),
    getTranslations('zen'),
    getLocale(),
  ])
  if (stats === null) {
    notFound()
  }
  const language = contentLanguageOf(locale)
  const titles: PracticeTitles = {
    breathing: zen('breathing.title'),
    sound: (programme) =>
      isSoundProgrammeId(programme) ? zen(`sounds.names.${programme}`) : programme,
  }
  const find = (kind: ZenContentStats['kind'], contentId: string) =>
    stats.items.find((item) => item.kind === kind && item.contentId === contentId) ?? null
  const rows: ZenStatsRow[] = [
    ...catalog.flatMap(([kind, ids]) =>
      ids.map((contentId) => ({
        key: `${kind}:${contentId}`,
        kindLabel: t(`kinds.${kind}`),
        title: practiceTitle(kind, contentId, language, titles),
        stats: find(kind, contentId),
      })),
    ),
    ...trackIds.map((trackId) => ({
      key: `track:${trackId}`,
      kindLabel: t('kinds.track'),
      title: trackText(language, trackId).title,
      stats: find('track', trackId),
    })),
  ]

  return (
    <>
      <WorkspaceHeader
        title={t('title')}
        description={t('description', { minimum: stats.minimumPeople })}
      />
      <ZenStatsTable rows={rows} />
      <p className="text-sm text-muted-foreground">{t('note')}</p>
    </>
  )
}
