import type { DatedMood } from '../check-ins/days.ts'
import { dayKey } from '../check-ins/days.ts'
import { meanOf } from './days.ts'

export interface TagCount {
  tag: string
  count: number
}

export interface ContextMood extends DatedMood {
  contexts: readonly string[]
}

export interface ContextEffect {
  context: string
  withAverage: number
  withoutAverage: number
  withDays: number
  withoutDays: number
  difference: number
}

interface DaySummary {
  average: number
  contexts: ReadonlySet<string>
}

export function frequentTags(tagLists: readonly (readonly string[])[], limit: number): TagCount[] {
  const counts = new Map<string, number>()
  for (const tags of tagLists) {
    for (const tag of new Set(tags)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((first, second) => second.count - first.count || first.tag.localeCompare(second.tag))
    .slice(0, limit)
}

function summariesByDay(checkIns: readonly ContextMood[], timeZone: string): DaySummary[] {
  const days = new Map<string, { levels: number[]; contexts: Set<string> }>()
  for (const checkIn of checkIns) {
    const key = dayKey(checkIn.recordedAt, timeZone)
    const day = days.get(key) ?? { levels: [], contexts: new Set<string>() }
    day.levels.push(checkIn.moodLevel)
    for (const context of checkIn.contexts) {
      day.contexts.add(context)
    }
    days.set(key, day)
  }
  return [...days.values()].map((day) => ({ average: meanOf(day.levels), contexts: day.contexts }))
}

export function contextEffects(
  checkIns: readonly ContextMood[],
  { timeZone, minDays }: { timeZone: string; minDays: number },
): ContextEffect[] {
  const days = summariesByDay(checkIns, timeZone)
  const contexts = new Set(days.flatMap((day) => [...day.contexts]))
  return [...contexts]
    .flatMap((context) => {
      const withContext = days.filter((day) => day.contexts.has(context)).map((day) => day.average)
      const without = days.filter((day) => !day.contexts.has(context)).map((day) => day.average)
      if (withContext.length < minDays || without.length < minDays) {
        return []
      }
      const withAverage = meanOf(withContext)
      const withoutAverage = meanOf(without)
      return [
        {
          context,
          withAverage,
          withoutAverage,
          withDays: withContext.length,
          withoutDays: without.length,
          difference: withAverage - withoutAverage,
        },
      ]
    })
    .sort(
      (first, second) =>
        second.difference - first.difference || first.context.localeCompare(second.context),
    )
}

export function notableEffects(
  effects: readonly ContextEffect[],
  { minDifference, limit }: { minDifference: number; limit: number },
): ContextEffect[] {
  return effects
    .filter((effect) => Math.abs(effect.difference) >= minDifference)
    .sort((first, second) => Math.abs(second.difference) - Math.abs(first.difference))
    .slice(0, limit)
    .sort((first, second) => second.difference - first.difference)
}
