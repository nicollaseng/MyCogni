import { describe, expect, it } from '@jest/globals'
import { isBlockedForKind, isComplementarySource, unavailableReasonOf } from './access.ts'
import {
  expiresAt,
  isOpenAssignment,
  isRepeatInterval,
  nextAvailableFrom,
  plainSummaryOf,
} from './lifecycle.ts'
import { scoreQuestionnaire } from './scoring.ts'

describe('assignment lifecycle', () => {
  it('repeats only every 7, 14 or 28 days', () => {
    expect([7, 14, 28].every(isRepeatInterval)).toBe(true)
    expect(isRepeatInterval(30)).toBe(false)
    expect(isRepeatInterval(null)).toBe(false)
  })

  it('opens the next repetition counted from the completion', () => {
    const completedAt = new Date('2026-10-22T13:00:00Z')
    expect(nextAvailableFrom(completedAt, 14).toISOString()).toBe('2026-11-05T13:00:00.000Z')
    expect(expiresAt(completedAt).toISOString()).toBe('2026-11-21T13:00:00.000Z')
  })

  it('treats only assigned and started questionnaires as open', () => {
    expect(isOpenAssignment('assigned')).toBe(true)
    expect(isOpenAssignment('in_progress')).toBe(true)
    expect(isOpenAssignment('completed')).toBe(false)
    expect(isOpenAssignment('cancelled')).toBe(false)
    expect(isOpenAssignment('expired')).toBe(false)
  })

  it('summarizes for the patient with an area, a plain level and the safety signal', () => {
    expect(plainSummaryOf('phq9', scoreQuestionnaire('phq9', [3, 3, 2, 2, 1, 1, 0, 0, 1]))).toEqual(
      {
        area: 'depression',
        level: 'moderate',
        safety: true,
      },
    )
    expect(plainSummaryOf('k6', scoreQuestionnaire('k6', [0, 0, 0, 0, 0, 0]))).toEqual({
      area: 'distress',
      level: 'low',
      safety: false,
    })
    expect(
      plainSummaryOf(
        'pcl5',
        scoreQuestionnaire(
          'pcl5',
          Array.from({ length: 20 }, () => 2),
        ),
      ).safety,
    ).toBe(false)
  })
})

describe('who can release each questionnaire', () => {
  it('keeps the GAD-7 away from psychologists while SATEPSI lists it as not evaluated', () => {
    expect(isBlockedForKind('gad7', 'psychologist')).toBe(true)
    expect(isBlockedForKind('gad7', 'psychiatrist')).toBe(false)
    expect(isBlockedForKind('phq9', 'psychologist')).toBe(false)
    expect(unavailableReasonOf('gad7', 'psychologist', 'pt-BR')).toBe('satepsi_not_evaluated')
    expect(unavailableReasonOf('gad7', 'physician', 'pt-BR')).toBeNull()
  })

  it('disables an instrument without an official text in the patient language', () => {
    expect(unavailableReasonOf('k10', 'psychiatrist', 'pt-PT')).toBe('no_official_text')
    expect(unavailableReasonOf('k6', 'psychoanalyst', 'pt-BR')).toBe('no_official_text')
    expect(unavailableReasonOf('k6', 'psychoanalyst', 'en-GB')).toBeNull()
  })

  it('marks every result as a complementary source for psychologists', () => {
    expect(isComplementarySource('psychologist')).toBe(true)
    expect(isComplementarySource('psychiatrist')).toBe(false)
  })
})
