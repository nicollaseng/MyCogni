import { describe, expect, it } from '@jest/globals'
import { canApprove, checklistOf, professionalsInView, statusOfView, viewOf } from './review'
import { reviewDetail } from './review-test-data'

describe('review views', () => {
  it('reads the view from the address and falls back to the waiting list', () => {
    expect(viewOf('revalidate')).toBe('revalidate')
    expect(viewOf('verified')).toBe('verified')
    expect(viewOf('anything')).toBe('pending')
    expect(viewOf(undefined)).toBe('pending')
    expect(statusOfView('revalidate')).toBe('verified')
    expect(statusOfView('rejected')).toBe('rejected')
  })

  it('keeps in Revalidar only verifications older than twelve months', () => {
    const now = new Date('2026-10-22T12:00:00Z')
    const old = reviewDetail({ status: 'verified', verifiedAt: '2025-10-01T12:00:00Z' })
    const recent = reviewDetail({ status: 'verified', verifiedAt: '2026-03-01T12:00:00Z' })
    const never = reviewDetail({ status: 'verified', verifiedAt: null })

    expect(professionalsInView([old, recent, never], 'revalidate', now)).toEqual([old])
    expect(professionalsInView([old, recent], 'verified', now)).toEqual([old, recent])
  })

  it('asks for the council search only when there is a council', () => {
    expect(checklistOf('crp')).toEqual(['name', 'registration', 'face', 'active'])
    expect(checklistOf(null)).toEqual(['name', 'institution', 'face'])
  })

  it('approves only with the document and the photo', () => {
    expect(canApprove(reviewDetail())).toBe(true)
    expect(canApprove(reviewDetail({ hasPhoto: false }))).toBe(false)
    expect(canApprove(reviewDetail({ document: null }))).toBe(false)
  })
})
