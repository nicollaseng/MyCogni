import { jest } from '@jest/globals'

interface FakeParam {
  value: number
  setValueAtTime: jest.Mock<(value: number, time: number) => void>
  linearRampToValueAtTime: jest.Mock<(value: number, time: number) => void>
  cancelScheduledValues: jest.Mock<(time: number) => void>
}

function param(value = 0): FakeParam {
  return {
    value,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
    cancelScheduledValues: jest.fn(),
  }
}

function node<T extends object>(extra: T) {
  const self = {
    ...extra,
    connect: jest.fn((target: unknown) => target),
    disconnect: jest.fn(),
  }
  return self
}

export function fakeAudioContext() {
  const oscillators: { frequency: FakeParam; type: string; start: jest.Mock; stop: jest.Mock }[] =
    []
  const gains: { gain: FakeParam }[] = []
  const pans: { pan: { value: number } }[] = []
  const context = {
    currentTime: 0,
    sampleRate: 100,
    destination: {},
    resume: jest.fn(() => Promise.resolve()),
    close: jest.fn(() => Promise.resolve()),
    createGain: () => {
      const gain = node({ gain: param(1) })
      gains.push(gain)
      return gain
    },
    createOscillator: () => {
      const oscillator = node({
        frequency: param(),
        type: 'sine',
        start: jest.fn(),
        stop: jest.fn(),
      })
      oscillators.push(oscillator)
      return oscillator
    },
    createStereoPanner: () => {
      const panner = node({ pan: { value: 0 } })
      pans.push(panner)
      return panner
    },
    createBuffer: (_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
    createBufferSource: () =>
      node({ buffer: null, loop: false, start: jest.fn(), stop: jest.fn() }),
    createBiquadFilter: () => node({ type: 'allpass', frequency: param() }),
  }
  return { context, oscillators, gains, pans }
}
