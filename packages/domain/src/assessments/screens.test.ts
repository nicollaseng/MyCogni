import { describe, expect, it } from '@jest/globals'
import { gad2 } from './gad2.ts'
import { gad7 } from './gad7.ts'
import { phq2, shortDepressionScreen } from './phq2.ts'
import { phq9 } from './phq9.ts'
import { askSafetyItemToAll, positiveScreenScores, safetyItem } from './screening-rules.ts'
import { isPositiveScreen, isShortScreen, twoStepScreens } from './screens.ts'

describe('two-step screens', () => {
  it('pairs each two-item screen with its full form', () => {
    expect(twoStepScreens).toEqual({
      depression: { screen: phq2, full: phq9 },
      anxiety: { screen: gad2, full: gad7 },
    })
    expect([phq2, gad2].map(isShortScreen)).toEqual([true, true])
    expect([phq9, gad7].map(isShortScreen)).toEqual([false, false])
  })

  it('starts from the PHQ-4 manual cut-offs of 3 for both screens', () => {
    expect(positiveScreenScores).toEqual({ depression: 3, anxiety: 3 })
    expect(isPositiveScreen('depression', [1, 1])).toBe(false)
    expect(isPositiveScreen('depression', [2, 1])).toBe(true)
    expect(isPositiveScreen('anxiety', [0, 2])).toBe(false)
    expect(isPositiveScreen('anxiety', [3, 0])).toBe(true)
  })

  it('scores only the two screen items, never the safety item', () => {
    expect(isPositiveScreen('depression', [1, 1, 3])).toBe(false)
    expect(isPositiveScreen('anxiety', [2])).toBe(false)
  })
})

describe('the safety item', () => {
  it('asks PHQ-9 item 9 to everyone with the mood screen', () => {
    expect(askSafetyItemToAll).toBe(true)
    expect(safetyItem).toBe(8)
    expect(phq2.items).toEqual([0, 1, 8])
    expect(phq2.riskItemIndex).toBe(2)
    expect(phq9.riskItemIndex).toBe(8)
  })

  it('can be limited to the full PHQ-9 by the clinical reviewer', () => {
    const withoutSafety = shortDepressionScreen(false)

    expect(withoutSafety.items).toEqual([0, 1])
    expect(withoutSafety.itemCount).toBe(2)
    expect(withoutSafety.riskItemIndex).toBeNull()
  })
})
