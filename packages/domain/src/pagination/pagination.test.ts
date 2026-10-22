import { describe, expect, it } from '@jest/globals'
import { clampPage, defaultPageSize, isPageSize, pageCountOf, pageSizes } from './pagination.ts'

describe('page sizes', () => {
  it('offers 10, 25, 50 and 100 per page and starts with 10', () => {
    expect(pageSizes).toEqual([10, 25, 50, 100])
    expect(defaultPageSize).toBe(10)
  })

  it('accepts only the offered sizes', () => {
    expect(isPageSize(25)).toBe(true)
    expect(isPageSize(20)).toBe(false)
    expect(isPageSize(0)).toBe(false)
    expect(isPageSize(Number.NaN)).toBe(false)
  })
})

describe('pageCountOf', () => {
  it('counts the pages needed, keeping one page for an empty list', () => {
    expect(pageCountOf(37, 10)).toBe(4)
    expect(pageCountOf(40, 10)).toBe(4)
    expect(pageCountOf(37, 50)).toBe(1)
    expect(pageCountOf(0, 10)).toBe(1)
  })
})

describe('clampPage', () => {
  it('keeps a page that exists', () => {
    expect(clampPage(2, 37, 10)).toBe(2)
    expect(clampPage(4, 37, 10)).toBe(4)
  })

  it('moves a page past the end to the last page', () => {
    expect(clampPage(5, 37, 10)).toBe(4)
    expect(clampPage(Number.MAX_SAFE_INTEGER, 37, 25)).toBe(2)
  })

  it('moves a page below one to the first page', () => {
    expect(clampPage(0, 37, 10)).toBe(1)
    expect(clampPage(-3, 37, 10)).toBe(1)
  })

  it('keeps the first page of an empty list and drops fractions', () => {
    expect(clampPage(3, 0, 10)).toBe(1)
    expect(clampPage(2.7, 37, 10)).toBe(2)
  })
})
