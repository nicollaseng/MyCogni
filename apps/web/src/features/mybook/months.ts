import type { JournalEntrySummary } from '@mycogni/contracts'
import { dayKey } from '@mycogni/domain'

export interface MonthGroup {
  key: string
  date: Date
  pages: JournalEntrySummary[]
}

export function groupByMonth(
  pages: readonly JournalEntrySummary[],
  timeZone: string,
): MonthGroup[] {
  const groups: MonthGroup[] = []
  for (const page of pages) {
    const date = new Date(page.updatedAt)
    const key = dayKey(date, timeZone).slice(0, 7)
    const group = groups.find((candidate) => candidate.key === key)
    if (group === undefined) {
      groups.push({ key, date, pages: [page] })
    } else {
      group.pages.push(page)
    }
  }
  return groups
}
