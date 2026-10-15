import { describe, expect, it } from '@jest/globals'
import { destinationOf, homePathOf } from './destination'

describe('homePathOf', () => {
  it('opens the professional area for professionals and today for patients', () => {
    expect(homePathOf('professional')).toBe('/pro')
    expect(homePathOf('patient')).toBe('/today')
  })
})

describe('destinationOf', () => {
  it('goes home when nothing was waiting', () => {
    expect(destinationOf('patient', null)).toBe('/today')
    expect(destinationOf('professional', null)).toBe('/pro')
  })

  it('honours the professional sign up only for professional accounts', () => {
    expect(destinationOf('professional', '/pro/join')).toBe('/pro/join')
    expect(destinationOf('patient', '/pro/join')).toBe('/today')
  })

  it('opens an invitation only for patient accounts', () => {
    expect(destinationOf('patient', '/invite/K7M2X9QA')).toBe('/invite/K7M2X9QA')
    expect(destinationOf('professional', '/invite/K7M2X9QA')).toBe('/pro')
  })
})
