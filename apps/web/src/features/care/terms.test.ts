import { describe, expect, it } from '@jest/globals'
import type { CareLink } from '@mycogni/contracts'
import { termsNoticeHref, termsReviewHref } from './terms'

function link(id: string, termsOutdated: boolean): CareLink {
  return {
    id,
    professional: {
      name: 'Helena Prado',
      kind: 'psychologist',
      registration: null,
      photoUrl: null,
    },
    sharesHistory: false,
    startedAt: '2026-10-01T15:00:00.000Z',
    consentVersion: termsOutdated ? '2026-10' : '2026-10-15',
    termsOutdated,
  }
}

describe('termsNoticeHref', () => {
  it('says nothing when every link is on the current terms', () => {
    expect(termsNoticeHref([])).toBeNull()
    expect(termsNoticeHref([link('a', false)])).toBeNull()
  })

  it('opens the review of the only link waiting for the new terms', () => {
    expect(termsNoticeHref([link('a', false), link('b', true)])).toBe(termsReviewHref('b'))
    expect(termsReviewHref('b')).toBe('/me/professionals/b/terms')
  })

  it('opens the professionals list when several links wait for the new terms', () => {
    expect(termsNoticeHref([link('a', true), link('b', true)])).toBe('/me#professionals')
  })
})
