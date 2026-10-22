import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { soundFadeOutSeconds, soundProgrammes } from '@mycogni/domain'
import { fakeAudioContext } from './fake-audio-context'
import { createFrequencyEngine, masterVolume } from './frequency-engine'

function engineWith(fake: ReturnType<typeof fakeAudioContext>) {
  return createFrequencyEngine(() => fake.context as unknown as AudioContext)
}

describe('frequency engine', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('plays one carrier in each ear for the binaural mode, under a soft bed', () => {
    const fake = fakeAudioContext()
    const engine = engineWith(fake)

    engine.start(soundProgrammes.calm, 'binaural')

    expect(fake.oscillators.map((oscillator) => oscillator.frequency.value)).toEqual([200, 210])
    expect(fake.pans.map((panner) => panner.pan.value)).toEqual([-1, 1])
    expect(fake.oscillators.every((oscillator) => oscillator.start.mock.calls.length === 1)).toBe(
      true,
    )
    expect(engine.playing()).toBe(true)
    const master = fake.gains[0]
    expect(master?.gain.linearRampToValueAtTime).toHaveBeenCalledWith(masterVolume, 4)
  })

  it('pulses one carrier at the beat for listening without headphones', () => {
    const fake = fakeAudioContext()

    engineWith(fake).start(soundProgrammes.sleep, 'isochronic')

    expect(fake.oscillators.map((oscillator) => oscillator.frequency.value)).toEqual([150, 2])
  })

  it('fades out gently before it stops and lets go of the audio', async () => {
    const fake = fakeAudioContext()
    const engine = engineWith(fake)
    engine.start(soundProgrammes.focus, 'binaural')
    engine.start(soundProgrammes.sleep, 'binaural')

    const stopped = engine.stop()
    const master = fake.gains[0]
    expect(master?.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, soundFadeOutSeconds)
    expect(fake.context.close).not.toHaveBeenCalled()
    expect(engine.playing()).toBe(false)
    jest.advanceTimersByTime(soundFadeOutSeconds * 1000)
    await stopped

    expect(fake.oscillators).toHaveLength(2)
    expect(fake.oscillators.every((oscillator) => oscillator.stop.mock.calls.length === 1)).toBe(
      true,
    )
    expect(fake.context.close).toHaveBeenCalled()
    await expect(engine.stop()).resolves.toBeUndefined()
  })
})
