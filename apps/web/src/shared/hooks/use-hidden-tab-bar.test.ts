import { describe, expect, it } from '@jest/globals'
import { renderHook } from '@testing-library/react'
import { useHiddenTabBar } from './use-hidden-tab-bar'

describe('useHiddenTabBar', () => {
  it('marks the document while hidden and clears the mark afterwards', () => {
    const { rerender, unmount } = renderHook(
      ({ hidden }) => {
        useHiddenTabBar(hidden)
      },
      { initialProps: { hidden: false } },
    )
    expect(document.documentElement).not.toHaveAttribute('data-tab-bar')

    rerender({ hidden: true })
    expect(document.documentElement).toHaveAttribute('data-tab-bar', 'hidden')

    rerender({ hidden: false })
    expect(document.documentElement).not.toHaveAttribute('data-tab-bar')

    rerender({ hidden: true })
    unmount()
    expect(document.documentElement).not.toHaveAttribute('data-tab-bar')
  })
})
