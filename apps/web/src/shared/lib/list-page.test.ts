import { describe, expect, it } from '@jest/globals'
import { listPageOf, listPageQuery, pageNumberOf, pageSizeOf, withQuery } from './list-page'

describe('pageSizeOf', () => {
  it('keeps the sizes on offer', () => {
    expect(pageSizeOf('10')).toBe(10)
    expect(pageSizeOf('25')).toBe(25)
    expect(pageSizeOf('50')).toBe(50)
    expect(pageSizeOf(['100', '25'])).toBe(100)
  })

  it('falls back to 10 for anything else', () => {
    expect(pageSizeOf(undefined)).toBe(10)
    expect(pageSizeOf('')).toBe(10)
    expect(pageSizeOf('20')).toBe(10)
    expect(pageSizeOf('1000')).toBe(10)
    expect(pageSizeOf('-25')).toBe(10)
    expect(pageSizeOf('vinte')).toBe(10)
  })
})

describe('pageNumberOf', () => {
  it('reads whole page numbers', () => {
    expect(pageNumberOf('1')).toBe(1)
    expect(pageNumberOf('7')).toBe(7)
    expect(pageNumberOf(['3', '9'])).toBe(3)
  })

  it('moves anything below one or unreadable to the first page', () => {
    expect(pageNumberOf(undefined)).toBe(1)
    expect(pageNumberOf('')).toBe(1)
    expect(pageNumberOf('0')).toBe(1)
    expect(pageNumberOf('-4')).toBe(1)
    expect(pageNumberOf('dois')).toBe(1)
    expect(pageNumberOf('-Infinity')).toBe(1)
  })

  it('drops fractions and keeps huge numbers safe for the server to clamp', () => {
    expect(pageNumberOf('2.9')).toBe(2)
    expect(pageNumberOf('1e30')).toBe(Number.MAX_SAFE_INTEGER)
    expect(pageNumberOf('Infinity')).toBe(Number.MAX_SAFE_INTEGER)
  })
})

describe('listPageOf', () => {
  it('reads the page and the size from the address', () => {
    expect(listPageOf({ page: '2', size: '25', q: 'mar' })).toEqual({ page: 2, size: 25 })
    expect(listPageOf({})).toEqual({ page: 1, size: 10 })
    expect(listPageOf({ page: '0', size: '7' })).toEqual({ page: 1, size: 10 })
  })
})

describe('listPageQuery', () => {
  it('leaves the first page and the default size out of the address', () => {
    expect(listPageQuery({ page: 1, size: 10 })).toEqual({})
    expect(listPageQuery({ page: 3, size: 10 })).toEqual({ page: '3' })
    expect(listPageQuery({ page: 1, size: 50 })).toEqual({ size: '50' })
    expect(listPageQuery({ page: 2, size: 25 })).toEqual({ page: '2', size: '25' })
  })
})

describe('withQuery', () => {
  it('adds the query only when there is one', () => {
    expect(withQuery('/mybook', {})).toBe('/mybook')
    expect(withQuery('/mybook', { q: 'café com leite', page: '2' })).toBe(
      '/mybook?q=caf%C3%A9+com+leite&page=2',
    )
  })
})
