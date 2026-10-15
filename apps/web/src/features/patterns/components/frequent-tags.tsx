import type { TagCount } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useCatalogLabels } from '@/features/check-in/use-catalog-labels'
import { Section } from '@/shared/components/section'

interface TagListProps {
  title: string
  tags: readonly TagCount[]
  labelOf: (tag: string) => string
}

function TagList({ title, tags, labelOf }: TagListProps) {
  const t = useTranslations('patterns.frequent')
  const most = Math.max(1, ...tags.map((tag) => tag.count))

  return (
    <div className="space-y-3">
      <h3 className="text-sm text-muted-foreground">{title}</h3>
      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('none')}</p>
      ) : (
        <ol className="space-y-2.5">
          {tags.map((tag) => (
            <li key={tag.tag} className="space-y-1">
              <p className="flex items-baseline justify-between gap-3">
                <span className="truncate">{labelOf(tag.tag)}</span>
                <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                  {t('count', { count: tag.count })}
                </span>
              </p>
              <span aria-hidden className="block h-1.5 rounded-xs bg-foreground/[0.05]">
                <span
                  className="block h-full rounded-xs bg-emphasis/70"
                  style={{ width: `${String((tag.count / most) * 100)}%` }}
                />
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

interface FrequentTagsProps {
  emotions: readonly TagCount[]
  contexts: readonly TagCount[]
}

export function FrequentTags({ emotions, contexts }: FrequentTagsProps) {
  const t = useTranslations('patterns.frequent')
  const labels = useCatalogLabels()

  return (
    <Section title={t('title')}>
      <div className="grid gap-6 pt-1 sm:grid-cols-2 sm:gap-10">
        <TagList title={t('emotions')} tags={emotions} labelOf={labels.emotion} />
        <TagList title={t('contexts')} tags={contexts} labelOf={labels.context} />
      </div>
    </Section>
  )
}
