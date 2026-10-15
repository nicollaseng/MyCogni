import { describe, expect, it } from '@jest/globals'
import { locales } from '../i18n/locales.ts'
import { assistantModes, riskForMode } from './assistant.ts'
import { assistantNotice, noticeKinds } from './notices.ts'

describe('riskForMode', () => {
  it('never blocks a professional, who gets care instructions instead', () => {
    expect(riskForMode('urgent', 'professional')).toBe('watch')
    expect(riskForMode('urgent', 'personal')).toBe('urgent')
    expect(riskForMode('watch', 'professional')).toBe('watch')
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
    expect(assistantNotice('en-GB', 'personal', 'crisis')).toContain('contacts below')
  })

  it('keeps the crisis message to two short sentences', () => {
    for (const locale of locales) {
      const notice = assistantNotice(locale, 'personal', 'crisis')
      expect(notice.split(/[.!?](?:\s|$)/u).filter((part) => part.trim() !== '')).toHaveLength(2)
      expect(notice.length).toBeLessThanOrEqual(110)
    }
  })
})
