import { describe, expect, it } from '@jest/globals'
import {
  ambientLoopAt,
  ambientLoopFiles,
  ambientSoundIds,
  ambientVolumeOf,
  defaultAmbientScope,
  defaultAmbientSound,
  defaultAmbientVolume,
  isAmbientScope,
  isAmbientSoundId,
} from './ambient.ts'

describe('ambient catalog', () => {
  it('starts with the sea, only in the Zen Space, very low', () => {
    expect(defaultAmbientSound).toBe('sea')
    expect(defaultAmbientScope).toBe('zen')
    expect(defaultAmbientVolume).toBeGreaterThanOrEqual(0.1)
    expect(defaultAmbientVolume).toBeLessThanOrEqual(0.15)
  })

  it('has one hashed loop file for every sound except silence', () => {
    expect(Object.keys(ambientLoopFiles).sort()).toEqual(
      ambientSoundIds.filter((id) => id !== 'none').sort(),
    )
    for (const file of Object.values(ambientLoopFiles)) {
      expect(file).toMatch(/^[a-z-]+\.[0-9a-f]{8}\.m4a$/)
    }
  })

  it('offers the calm nature sounds first, brown noise next and silence last', () => {
    expect(ambientSoundIds).toEqual([
      'sea',
      'rain',
      'forest',
      'night-forest',
      'birdsong',
      'meadow',
      'campfire',
      'mountain-wind',
      'snow',
      'owl',
      'brown-noise',
      'none',
    ])
  })

  it('recognises sounds and scopes only', () => {
    expect(isAmbientSoundId('rain')).toBe(true)
    expect(isAmbientSoundId('chuva')).toBe(false)
    expect(isAmbientScope('app')).toBe(true)
    expect(isAmbientScope(3)).toBe(false)
  })
})

describe('ambientVolumeOf', () => {
  it('keeps a valid volume between zero and one and falls back to the default', () => {
    expect(ambientVolumeOf(0.4)).toBe(0.4)
    expect(ambientVolumeOf(3)).toBe(1)
    expect(ambientVolumeOf(-1)).toBe(0)
    expect(ambientVolumeOf(Number.NaN)).toBe(defaultAmbientVolume)
    expect(ambientVolumeOf('0.5')).toBe(defaultAmbientVolume)
  })
})

describe('ambientLoopAt', () => {
  it('plays in the Zen Space by default and everywhere when asked', () => {
    expect(ambientLoopAt({ scope: 'zen', sound: 'sea', onZen: true })).toBe('sea')
    expect(ambientLoopAt({ scope: 'zen', sound: 'sea', onZen: false })).toBeNull()
    expect(ambientLoopAt({ scope: 'app', sound: 'rain', onZen: false })).toBe('rain')
  })

  it('stays silent when turned off or when no sound is chosen', () => {
    expect(ambientLoopAt({ scope: 'off', sound: 'sea', onZen: true })).toBeNull()
    expect(ambientLoopAt({ scope: 'app', sound: 'none', onZen: true })).toBeNull()
  })
})
