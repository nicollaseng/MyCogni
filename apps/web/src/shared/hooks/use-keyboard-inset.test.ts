import { afterEach, describe, expect, it } from '@jest/globals'
import { renderHook } from '@testing-library/react'
import { installVisualViewport, type FakeViewport } from '@/test/visual-viewport'
import { keyboardInset, smallestKeyboard, useKeyboardInset } from './use-keyboard-inset'

let viewport: FakeViewport | null = null

afterEach(() => {
  viewport?.remove()
  viewport = null
})

describe('keyboardInset', () => {
  it('measures what the visual viewport leaves uncovered at the bottom', () => {
    expect(keyboardInset(844, { height: 844, offsetTop: 0 })).toBe(0)
    expect(keyboardInset(844, { height: 508, offsetTop: 0 })).toBe(336)
    expect(keyboardInset(844, { height: 508, offsetTop: 120 })).toBe(216)
    expect(keyboardInset(844, { height: 507.6, offsetTop: 0 })).toBe(336)
  })

  it('ignores small changes such as the browser bars and never goes below zero', () => {
    expect(keyboardInset(844, { height: 844 - smallestKeyboard + 1, offsetTop: 0 })).toBe(0)
    expect(keyboardInset(844, { height: 900, offsetTop: 0 })).toBe(0)
    expect(keyboardInset(844, null)).toBe(0)
  })
})

describe('useKeyboardInset', () => {
  it('follows the keyboard as the visual viewport resizes and scrolls', () => {
    viewport = installVisualViewport()
    const { result } = renderHook(() => useKeyboardInset())
    expect(result.current).toBe(0)

    viewport.showKeyboard(320)
    expect(result.current).toBe(320)

    viewport.move({ height: window.innerHeight - 420, offsetTop: 100 })
    expect(result.current).toBe(320)

    viewport.hideKeyboard()
    expect(result.current).toBe(0)
  })

  it('stays at zero where the browser has no visual viewport', () => {
    const { result } = renderHook(() => useKeyboardInset())
    expect(result.current).toBe(0)
  })
})
