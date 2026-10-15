import { describe, expect, it } from '@jest/globals'
import { continueTargetOf } from './continue-path'

describe('continueTargetOf', () => {
  it('continues to an invitation or to the professional sign up', () => {
    expect(continueTargetOf('/invite/K7M2X9QA')).toBe('/invite/K7M2X9QA')
    expect(continueTargetOf('/pro/join')).toBe('/pro/join')
  })

  it('refuses any other destination, so the link cannot send people elsewhere', () => {
    expect(continueTargetOf('https://evil.example/invite/K7M2X9QA')).toBeNull()
    expect(continueTargetOf('//evil.example')).toBeNull()
    expect(continueTargetOf('/invite/K7M2X9QA/../../me')).toBeNull()
    expect(continueTargetOf('/invite/k7m2x9qa')).toBeNull()
    expect(continueTargetOf('/me')).toBeNull()
    expect(continueTargetOf('')).toBeNull()
  })
})
