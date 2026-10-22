export const pageSizes = [10, 25, 50, 100] as const

export type PageSize = (typeof pageSizes)[number]

export const defaultPageSize: PageSize = 10

export const maxPageSize: PageSize = 100

export function isPageSize(value: number): value is PageSize {
  return pageSizes.some((size) => size === value)
}

export function pageCountOf(total: number, size: number): number {
  return Math.max(1, Math.ceil(total / size))
}

export function clampPage(page: number, total: number, size: number): number {
  return Math.min(Math.max(1, Math.trunc(page)), pageCountOf(total, size))
}
