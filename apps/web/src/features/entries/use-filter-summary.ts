import { filterParts, type FilterPart, type MoodRange } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useCatalogLabels } from '@/features/check-in/use-catalog-labels'
import { isMoodLevel, moodKeyOf } from '@/features/mood/mood-levels'
import { selectionOf, type EntryFilters } from './filters'

function capitalize(text: string, locale: string): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1)
}

export function useMoodRangeText(): (range: MoodRange | null) => string {
  const t = useTranslations('entries.filters.mood')
  const mood = useTranslations('common.mood')
  const locale = useLocale()
  const nameOf = (level: number) =>
    isMoodLevel(level) ? mood(moodKeyOf(level)).toLocaleLowerCase(locale) : String(level)

  return (range) => {
    if (range === null) {
      return t('any')
    }
    return range.min === range.max
      ? t('single', { mood: nameOf(range.min) })
      : t('range', { from: nameOf(range.min), to: nameOf(range.max) })
  }
}

export function useFilterSummary(filters: EntryFilters): string[] {
  const t = useTranslations('entries.filters')
  const labels = useCatalogLabels()
  const locale = useLocale()
  const moodText = useMoodRangeText()

  function textOf(part: FilterPart): string {
    switch (part.kind) {
      case 'period':
        return t('period.last', { days: part.days })
      case 'mood':
        return moodText(part)
      case 'emotion':
        return labels.emotion(part.tag)
      case 'context':
        return labels.context(part.tag)
      case 'note':
        return t('noteSummary')
    }
  }

  const parts = filterParts(selectionOf(filters))
  const anyOf = new Intl.ListFormat(locale, { type: 'disjunction' })
  const texts = parts.flatMap((part, index) => {
    if (part.kind !== 'emotion' && part.kind !== 'context') {
      return [textOf(part)]
    }
    const first = parts.findIndex((other) => other.kind === part.kind) === index
    return first
      ? [anyOf.format(parts.filter((other) => other.kind === part.kind).map(textOf))]
      : []
  })
  return texts.map((text) => capitalize(text, locale))
}
