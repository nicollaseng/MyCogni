import { afterEach, describe, expect, it } from '@jest/globals'
import {
  draftLifetimeDays,
  forgetScreeningDraft,
  hasScreeningDraft,
  readScreeningDraft,
  writeScreeningDraft,
} from './draft'

const userId = '6f1c4a52-61f7-4c1b-9d3c-1b0d2a4f2a10'

const now = Date.parse('2026-10-22T12:00:00Z')

afterEach(() => {
  window.localStorage.clear()
})

describe('screening drafts', () => {
  it('keeps the answers and the saved areas of one person on this device', () => {
    writeScreeningDraft(userId, {
      updatedAt: now,
      answers: { depression: { 0: 1, 1: 0, 8: 0 }, anxiety: { 0: 2 } },
      saved: { depression: '0b7c6c8e-6a8f-4f53-9f4b-000000000001' },
    })

    expect(hasScreeningDraft(userId)).toBe(true)
    expect(hasScreeningDraft('someone-else')).toBe(false)
    expect(readScreeningDraft(userId, now)).toEqual({
      updatedAt: now,
      answers: { depression: { 0: 1, 1: 0, 8: 0 }, anxiety: { 0: 2 } },
      saved: { depression: '0b7c6c8e-6a8f-4f53-9f4b-000000000001' },
    })

    forgetScreeningDraft(userId)
    expect(readScreeningDraft(userId, now)).toBeNull()
  })

  it('drops an old or broken draft', () => {
    writeScreeningDraft(userId, {
      updatedAt: now - (draftLifetimeDays + 1) * 24 * 60 * 60 * 1000,
      answers: { depression: { 0: 1 }, anxiety: {} },
      saved: {},
    })
    expect(readScreeningDraft(userId, now)).toBeNull()
    expect(hasScreeningDraft(userId)).toBe(false)

    window.localStorage.setItem(
      `mycogni.screening.draft.${userId}`,
      '{"answers":{"depression":{"0":9}}}',
    )
    expect(readScreeningDraft(userId, now)).toBeNull()
  })
})
