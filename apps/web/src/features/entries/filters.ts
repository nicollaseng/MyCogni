import {
  checkInLimits,
  checkInSearchLength,
  moodRangeOf,
  moodRangeParam,
  tagListOf,
  type EntryFilterSelection,
  type MoodRange,
} from '@mycogni/domain'
import type { CheckInFilter } from '@/shared/lib/api/resources'

export const periods = ['7', '30', '90'] as const

export type Period = (typeof periods)[number]

export interface EntryFilters {
  q: string
  period: Period | null
  mood: MoodRange | null
  emotions: readonly string[]
  contexts: readonly string[]
  withNote: boolean
}

export type SearchParams = Partial<Record<string, string | string[] | undefined>>

export type EntriesHref = '/entries' | `/entries?${string}`

export const noFilters: EntryFilters = {
  q: '',
  period: null,
  mood: null,
  emotions: [],
  contexts: [],
  withNote: false,
}

const dayInMs = 24 * 60 * 60 * 1000

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function isPeriod(value: string | undefined): value is Period {
  return periods.some((period) => period === value)
}

export function parseEntryFilters(params: SearchParams): EntryFilters {
  const period = firstParam(params.period)
  const emotions = tagListOf(firstParam(params.emotion))
  return {
    q: (firstParam(params.q) ?? '').trim().slice(0, checkInSearchLength),
    period: isPeriod(period) ? period : null,
    mood: moodRangeOf(firstParam(params.mood)),
    emotions,
    contexts: tagListOf(firstParam(params.context), checkInLimits.tags - emotions.length),
    withNote: firstParam(params.note) === '1',
  }
}

export function selectionOf(filters: EntryFilters): EntryFilterSelection {
  return {
    period: filters.period === null ? null : Number(filters.period),
    mood: filters.mood,
    emotions: filters.emotions,
    contexts: filters.contexts,
    withNote: filters.withNote,
  }
}

export function isFiltered(filters: EntryFilters): boolean {
  return (
    filters.q !== '' ||
    filters.period !== null ||
    filters.mood !== null ||
    filters.emotions.length > 0 ||
    filters.contexts.length > 0 ||
    filters.withNote
  )
}

function listParam(tags: readonly string[]): string | null {
  return tags.length === 0 ? null : tags.join(',')
}

export function entryQuery(filters: EntryFilters, before?: string): Record<string, string> {
  const entries: [string, string | null][] = [
    ['q', filters.q === '' ? null : filters.q],
    ['period', filters.period],
    ['mood', filters.mood === null ? null : moodRangeParam(filters.mood)],
    ['emotion', listParam(filters.emotions)],
    ['context', listParam(filters.contexts)],
    ['note', filters.withNote ? '1' : null],
    ['before', before ?? null],
  ]
  return Object.fromEntries(
    entries.flatMap(([key, value]) => (value === null ? [] : [[key, value]])),
  )
}

function withQuery<Path extends string>(
  path: Path,
  filters: EntryFilters,
): Path | `${Path}?${string}` {
  const query = new URLSearchParams(entryQuery(filters)).toString()
  return query === '' ? path : `${path}?${query}`
}

export function entriesHref(filters: EntryFilters): EntriesHref {
  return withQuery('/entries', filters)
}

export function entryHref(id: string, filters: EntryFilters): `/entries/${string}` {
  return withQuery(`/entries/${id}`, filters)
}

export function checkInFilterOf(
  filters: EntryFilters,
  { now, qTags }: { now: Date; qTags: readonly string[] },
): CheckInFilter {
  return {
    since:
      filters.period === null
        ? undefined
        : new Date(now.getTime() - Number(filters.period) * dayInMs),
    q: filters.q === '' ? undefined : filters.q,
    qTags: filters.q === '' ? undefined : qTags,
    emotions: filters.emotions,
    contexts: filters.contexts,
    minMood: filters.mood?.min,
    maxMood: filters.mood?.max,
    hasNote: filters.withNote ? true : undefined,
  }
}
