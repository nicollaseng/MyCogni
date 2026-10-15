import { describe, expect, it } from '@jest/globals'
import { fitsInPage, photoProblem } from './photos'

const megabyte = 1024 * 1024

describe('photoProblem', () => {
  it('accepts JPG, PNG, WebP and GIF photos up to 10 MB', () => {
    expect(photoProblem({ type: 'image/jpeg', size: 3 * megabyte })).toBeNull()
    expect(photoProblem({ type: 'image/png', size: 10 * megabyte })).toBeNull()
    expect(photoProblem({ type: 'image/webp', size: 1 })).toBeNull()
    expect(photoProblem({ type: 'image/gif', size: 1 })).toBeNull()
  })

  it('refuses files that are not supported photos', () => {
    expect(photoProblem({ type: 'image/heic', size: megabyte })).toBe('notImage')
    expect(photoProblem({ type: 'application/pdf', size: megabyte })).toBe('notImage')
  })

  it('refuses photos larger than 10 MB', () => {
    expect(photoProblem({ type: 'image/jpeg', size: 10 * megabyte + 1 })).toBe('tooLarge')
  })
})

describe('fitsInPage', () => {
  it('keeps a page within 30 photos', () => {
    expect(fitsInPage(28, 2)).toBe(true)
    expect(fitsInPage(29, 2)).toBe(false)
  })
})
