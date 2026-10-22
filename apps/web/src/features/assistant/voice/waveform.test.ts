import { describe, expect, it } from '@jest/globals'
import { activeLevel, barHeight, formatElapsed, levelOf, pushLevel, waveformBars } from './waveform'

function wave(amplitude: number): Uint8Array {
  return Uint8Array.from({ length: 512 }, (_, index) =>
    Math.round(128 + amplitude * 127 * Math.sin((index / 512) * Math.PI * 16)),
  )
}

describe('voice waveform', () => {
  it('reads silence as nothing and a loud voice as full', () => {
    expect(levelOf(new Uint8Array(0))).toBe(0)
    expect(levelOf(new Uint8Array(512).fill(128))).toBe(0)
    expect(levelOf(wave(0.002))).toBe(0)
    expect(levelOf(wave(0.9))).toBe(1)
  })

  it('grows with the voice in between', () => {
    const soft = levelOf(wave(0.05))
    const medium = levelOf(wave(0.15))

    expect(soft).toBeGreaterThan(0)
    expect(medium).toBeGreaterThan(soft)
    expect(medium).toBeLessThan(1)
  })

  it('keeps a fixed number of recent levels, newest last', () => {
    const start = Array.from({ length: waveformBars }, () => 0)
    const next = pushLevel(start, 0.5)

    expect(next).toHaveLength(waveformBars)
    expect(next.at(-1)).toBe(0.5)
    expect(pushLevel([0.1], 0.2)).toEqual([0.1, 0.2])
  })

  it('draws quiet moments as dots and voice as short bars', () => {
    expect(barHeight(0)).toBe(4)
    expect(barHeight(activeLevel - 0.01)).toBe(4)
    expect(barHeight(activeLevel)).toBeGreaterThan(4)
    expect(barHeight(1)).toBe(26)
  })

  it('shows the elapsed time as minutes and seconds', () => {
    expect(formatElapsed(0)).toBe('0:00')
    expect(formatElapsed(7.9)).toBe('0:07')
    expect(formatElapsed(120)).toBe('2:00')
    expect(formatElapsed(-3)).toBe('0:00')
  })
})
