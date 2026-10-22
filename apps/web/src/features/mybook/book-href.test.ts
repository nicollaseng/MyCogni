import { describe, expect, it } from '@jest/globals'
import { bookHref } from './book-href'

describe('bookHref', () => {
  it('keeps the search with the page and the size', () => {
    expect(bookHref('', { page: 1, size: 10 })).toBe('/mybook')
    expect(bookHref('', { page: 2, size: 25 })).toBe('/mybook?page=2&size=25')
    expect(bookHref('mar', { page: 3, size: 10 })).toBe('/mybook?q=mar&page=3')
    expect(bookHref('dia bom', { page: 1, size: 50 })).toBe('/mybook?q=dia+bom&size=50')
  })
})
