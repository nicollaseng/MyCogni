import { defaultPageSize, isPageSize, type PageSize } from '@mycogni/domain'

export interface ListPage {
  page: number
  size: PageSize
}

type Param = string | string[] | undefined

function firstOf(value: Param): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function pageSizeOf(value: Param): PageSize {
  const size = Number(firstOf(value))
  return isPageSize(size) ? size : defaultPageSize
}

export function pageNumberOf(value: Param): number {
  const page = Math.trunc(Number(firstOf(value)))
  return Number.isNaN(page) || page < 1 ? 1 : Math.min(page, Number.MAX_SAFE_INTEGER)
}

export function listPageOf(params: Partial<Record<string, Param>>): ListPage {
  return { page: pageNumberOf(params.page), size: pageSizeOf(params.size) }
}

export function listPageQuery({ page, size }: ListPage): Record<string, string> {
  return {
    ...(page > 1 ? { page: String(page) } : {}),
    ...(size === defaultPageSize ? {} : { size: String(size) }),
  }
}

export function withQuery<Path extends string>(
  path: Path,
  query: Record<string, string>,
): Path | `${Path}?${string}` {
  const search = new URLSearchParams(query).toString()
  return search === '' ? path : `${path}?${search}`
}
