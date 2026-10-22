import { clampPage } from '@mycogni/domain'

export interface PageWindow {
  page: number
  size: number
}

export interface RecordPage<T> {
  records: T[]
  total: number
  page: number
}

export async function pageOf<T>(
  { page, size }: PageWindow,
  total: number,
  load: (offset: number) => Promise<T[]>,
): Promise<RecordPage<T>> {
  const current = clampPage(page, total, size)
  return { records: total === 0 ? [] : await load((current - 1) * size), total, page: current }
}
