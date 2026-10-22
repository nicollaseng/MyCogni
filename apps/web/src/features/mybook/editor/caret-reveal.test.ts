import { describe, expect, it } from '@jest/globals'
import { caretMargin, caretShift } from './caret-reveal'

describe('caretShift', () => {
  it('leaves a caret that is already clear of the bar where it is', () => {
    expect(caretShift({ top: 300, bottom: 330 }, 0, 476)).toBe(0)
    expect(caretShift({ top: 400, bottom: 476 - caretMargin }, 0, 476)).toBe(0)
  })

  it('scrolls a caret under the bar up until it sits above it with some room', () => {
    expect(caretShift({ top: 470, bottom: 500 }, 0, 476)).toBe(500 - (476 - caretMargin))
    expect(caretShift({ top: 700, bottom: 730 }, 0, 476)).toBe(730 - (476 - caretMargin))
  })

  it('scrolls a caret above the visible area back down into view', () => {
    expect(caretShift({ top: 90, bottom: 120 }, 100, 476)).toBe(90 - (100 + caretMargin))
    expect(caretShift({ top: -40, bottom: -10 }, 0, 476)).toBe(-40 - caretMargin)
  })
})
