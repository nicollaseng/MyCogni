import { describe, expect, it } from '@jest/globals'
import {
  binauralTones,
  isSoundProgrammeId,
  soundProgrammeIds,
  soundProgrammes,
  soundTimers,
  timerSeconds,
} from './sounds.ts'

describe('frequency sound programmes', () => {
  it('names each programme by its intent with a beat in the matching band', () => {
    const bands = {
      sleep: [0.5, 4],
      meditate: [4, 8],
      ease: [7, 9],
      calm: [8, 13],
      lift: [10, 15],
      focus: [13, 30],
    } as const
    for (const id of soundProgrammeIds) {
      const { beat, carrier } = soundProgrammes[id]
      expect(beat).toBeGreaterThanOrEqual(bands[id][0])
      expect(beat).toBeLessThanOrEqual(bands[id][1])
      expect(carrier).toBeGreaterThanOrEqual(100)
      expect(carrier).toBeLessThanOrEqual(400)
    }
  })

  it('plays one carrier in each ear, apart by the beat', () => {
    expect(binauralTones(soundProgrammes.calm)).toEqual([200, 210])
    expect(binauralTones(soundProgrammes.sleep)).toEqual([150, 152])
  })

  it('offers 10, 20 and 30 minutes or no end', () => {
    expect(soundTimers).toEqual([10, 20, 30, null])
    expect(timerSeconds(20)).toBe(1200)
    expect(timerSeconds(null)).toBeNull()
    expect(isSoundProgrammeId('calm')).toBe(true)
    expect(isSoundProgrammeId('cure')).toBe(false)
  })
})
