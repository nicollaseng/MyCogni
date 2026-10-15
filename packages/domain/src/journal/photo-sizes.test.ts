import { describe, expect, it } from '@jest/globals'
import {
  approximatePhotoSize,
  estimatedPhotoBytes,
  isHeicPhoto,
  isJournalPhotoSize,
  journalPhotoLongestSide,
  journalPhotoProblem,
  originalPhotoProblem,
  photoTarget,
  planJournalPhoto,
} from './photo-sizes.ts'

const megabyte = 1024 * 1024

const camera = { width: 4032, height: 3024, bytes: 3 * megabyte, type: 'image/jpeg' }

describe('photoTarget', () => {
  it('shrinks the longest side to the chosen size and keeps the proportion', () => {
    expect(photoTarget(camera, journalPhotoLongestSide.low)).toEqual({ width: 1024, height: 768 })
    expect(photoTarget(camera, journalPhotoLongestSide.medium)).toEqual({
      width: 1600,
      height: 1200,
    })
    expect(photoTarget({ width: 3024, height: 4032 }, journalPhotoLongestSide.high)).toEqual({
      width: 1920,
      height: 2560,
    })
  })

  it('never enlarges a photo that is already small', () => {
    expect(photoTarget({ width: 800, height: 600 }, journalPhotoLongestSide.high)).toEqual({
      width: 800,
      height: 600,
    })
  })

  it('keeps at least one pixel on a very thin panorama', () => {
    expect(photoTarget({ width: 20000, height: 4 }, 1024)).toEqual({ width: 1024, height: 1 })
  })
})

describe('planJournalPhoto', () => {
  it('resizes and estimates the size of the new file', () => {
    expect(planJournalPhoto(camera, 'medium', 'image/jpeg')).toEqual({
      kind: 'resize',
      width: 1600,
      height: 1200,
      bytes: estimatedPhotoBytes({ width: 1600, height: 1200 }, 'image/jpeg'),
    })
    expect(estimatedPhotoBytes({ width: 1600, height: 1200 }, 'image/webp')).toBeLessThan(
      estimatedPhotoBytes({ width: 1600, height: 1200 }, 'image/jpeg'),
    )
  })

  it('keeps a small and light photo as it is instead of encoding it again', () => {
    const small = { width: 900, height: 600, bytes: 60_000, type: 'image/jpeg' }
    expect(planJournalPhoto(small, 'low', 'image/webp')).toEqual({
      kind: 'keep',
      width: 900,
      height: 600,
      bytes: 60_000,
    })
    expect(planJournalPhoto({ ...small, type: 'image/png' }, 'low', 'image/webp').kind).toBe(
      'resize',
    )
    expect(planJournalPhoto({ ...small, bytes: 900_000 }, 'low', 'image/jpeg').kind).toBe('resize')
  })

  it('sends the original file only when the journal accepts it as it is', () => {
    expect(planJournalPhoto(camera, 'original', 'image/jpeg')).toEqual({
      kind: 'keep',
      width: 4032,
      height: 3024,
      bytes: 3 * megabyte,
    })
    expect(planJournalPhoto({ ...camera, bytes: 12 * megabyte }, 'original', 'image/jpeg')).toEqual(
      { kind: 'unavailable', reason: 'tooLarge' },
    )
    expect(planJournalPhoto({ ...camera, type: 'image/heic' }, 'original', 'image/jpeg')).toEqual({
      kind: 'unavailable',
      reason: 'format',
    })
  })
})

describe('photo limits', () => {
  it('accepts phone photos up to the source limit, HEIC included', () => {
    expect(journalPhotoProblem({ type: 'image/jpeg', name: 'a.jpg', size: 25 * megabyte })).toBe(
      null,
    )
    expect(journalPhotoProblem({ type: 'image/heic', name: 'a.heic', size: megabyte })).toBe(null)
    expect(journalPhotoProblem({ type: 'image/jpeg', name: 'a.jpg', size: 41 * megabyte })).toBe(
      'tooLarge',
    )
    expect(journalPhotoProblem({ type: 'image/jpeg', name: 'a.jpg', size: 0 })).toBe('tooLarge')
    expect(journalPhotoProblem({ type: 'text/plain', name: 'a.txt', size: 10 })).toBe('notImage')
  })

  it('recognises HEIC by type or by name when the browser gives no type', () => {
    expect(isHeicPhoto({ type: 'image/heif', name: 'foto' })).toBe(true)
    expect(isHeicPhoto({ type: '', name: 'IMG_0001.HEIC' })).toBe(true)
    expect(isHeicPhoto({ type: 'image/jpeg', name: 'IMG_0001.heic' })).toBe(false)
  })

  it('explains why the original cannot be sent', () => {
    expect(originalPhotoProblem({ type: 'image/png', size: 10 * megabyte })).toBe(null)
    expect(originalPhotoProblem({ type: 'image/png', size: 10 * megabyte + 1 })).toBe('tooLarge')
    expect(originalPhotoProblem({ type: 'image/heic', size: megabyte })).toBe('format')
  })

  it('knows the sizes a person can choose', () => {
    expect(isJournalPhotoSize('medium')).toBe(true)
    expect(isJournalPhotoSize('huge')).toBe(false)
    expect(isJournalPhotoSize(null)).toBe(false)
  })
})

describe('approximatePhotoSize', () => {
  it('rounds to kilobytes below one megabyte and to one decimal above', () => {
    expect(approximatePhotoSize(300)).toEqual({ amount: 1, unit: 'kilobyte' })
    expect(approximatePhotoSize(42 * 1024 + 300)).toEqual({ amount: 42, unit: 'kilobyte' })
    expect(approximatePhotoSize(384_000)).toEqual({ amount: 380, unit: 'kilobyte' })
    expect(approximatePhotoSize(1000 * 1024)).toEqual({ amount: 1, unit: 'megabyte' })
    expect(approximatePhotoSize(3.46 * megabyte)).toEqual({ amount: 3.5, unit: 'megabyte' })
  })
})
