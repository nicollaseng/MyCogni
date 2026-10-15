import { describe, expect, it } from '@jest/globals'
import { mergeRisk, needsSupport } from './risk.ts'

describe('mergeRisk', () => {
  it('takes the highest level from the detector and the model', () => {
    expect(mergeRisk()).toBe('none')
    expect(mergeRisk('none', 'none')).toBe('none')
    expect(mergeRisk('watch', 'none')).toBe('watch')
    expect(mergeRisk('none', 'urgent', 'watch')).toBe('urgent')
  })

  it('asks for support from watch upwards', () => {
    expect(needsSupport('none')).toBe(false)
    expect(needsSupport('watch')).toBe(true)
    expect(needsSupport('urgent')).toBe(true)
  })
})
