import type { CheckIn } from '@mycogni/contracts'

export interface Page<T> {
  items: T[]
  page: number
  pageCount: number
  from: number
  to: number
  total: number
}

export function paginate<T>(items: readonly T[], page: number, size: number): Page<T> {
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / size))
  const current = Math.min(Math.max(1, Math.trunc(page)), pageCount)
  const start = (current - 1) * size
  const slice = items.slice(start, start + size)
  return {
    items: slice,
    page: current,
    pageCount,
    from: total === 0 ? 0 : start + 1,
    to: start + slice.length,
    total,
  }
}

export function visibleCheckIns(
  checkIns: readonly CheckIn[],
  { onlyNotes }: { onlyNotes: boolean },
): CheckIn[] {
  return checkIns
    .filter((checkIn) => !onlyNotes || checkIn.note !== null)
    .sort((first, second) => second.recordedAt.localeCompare(first.recordedAt))
}
