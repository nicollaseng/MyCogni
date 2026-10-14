import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { MoodStrip } from './mood-strip'

function barsOf(label: string): HTMLElement[] {
  return Array.from(screen.getByRole('img', { name: label }).querySelectorAll<HTMLElement>('span'))
}

describe('MoodStrip', () => {
  it('draws one bar per day, taller for better days', () => {
    render(<MoodStrip days={[0, 3, 6]} label="Três dias" />)

    const bars = barsOf('Três dias')

    expect(bars.map((bar) => bar.getAttribute('data-day'))).toEqual(['0', '3', '6'])
    expect(bars.map((bar) => parseInt(bar.style.height, 10))).toEqual([28, 64, 100])
  })

  it('keeps a quiet mark for days without a record', () => {
    render(<MoodStrip days={[null, 4, null]} label="Dias com lacunas" />)

    expect(barsOf('Dias com lacunas').map((bar) => bar.getAttribute('data-day'))).toEqual([
      'empty',
      '4',
      'empty',
    ])
  })
})
