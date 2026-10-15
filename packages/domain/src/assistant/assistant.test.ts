import { describe, expect, it } from '@jest/globals'
import { locales } from '../i18n/locales.ts'
import { assistantModes, mergeRisk, needsSupport } from './assistant.ts'
import { assistantNotice, noticeKinds } from './notices.ts'

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

describe('assistantNotice', () => {
  it('has every fixed message for every locale and mode', () => {
    for (const locale of locales) {
      for (const mode of assistantModes) {
        for (const kind of noticeKinds) {
          expect(assistantNotice(locale, mode, kind).length).toBeGreaterThan(20)
        }
      }
    }
  })

  it('writes the crisis message in the variant of the person', () => {
    expect(assistantNotice('pt-BR', 'personal', 'crisis')).toContain('você')
    expect(assistantNotice('pt-PT', 'personal', 'crisis')).toContain('contactos')
    expect(assistantNotice('en-GB', 'personal', 'crisis')).toContain('emergency')
  })
})
