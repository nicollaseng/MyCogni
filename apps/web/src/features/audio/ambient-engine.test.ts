import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { AmbientLoopId } from '@mycogni/domain'
import { ambientUrl, createAmbientEngine, type AmbientContext } from './ambient-engine'

interface FakeParam {
  value: number
  targets: number[]
  curves: number[]
  cancelScheduledValues: () => void
  setTargetAtTime: (value: number) => void
  setValueCurveAtTime: (values: Float32Array, at: number) => void
}

function param(): FakeParam {
  const fake: FakeParam = {
    value: 1,
    targets: [],
    curves: [],
    cancelScheduledValues: () => undefined,
    setTargetAtTime: (value) => {
      fake.targets.push(value)
    },
    setValueCurveAtTime: (_, at) => {
      fake.curves.push(at)
    },
  }
  return fake
}

function fakeContext() {
  const gains: { gain: FakeParam }[] = []
  const sources: { starts: number[]; stops: number[] }[] = []
  const context = {
    currentTime: 10,
    state: 'suspended',
    destination: {},
    onstatechange: null as (() => void) | null,
    resume: jest.fn(() => {
      context.state = 'running'
      return Promise.resolve()
    }),
    createGain: () => {
      const node = { gain: param(), connect: () => undefined, disconnect: () => undefined }
      gains.push(node)
      return node
    },
    createBufferSource: () => {
      const node = {
        buffer: null,
        onended: null,
        starts: [] as number[],
        stops: [] as number[],
        connect: () => undefined,
        start: (at: number) => {
          node.starts.push(at)
        },
        stop: (at: number) => {
          node.stops.push(at)
        },
      }
      sources.push(node)
      return node
    },
    decodeAudioData: () => Promise.resolve({ duration: 60 }),
  }
  return { context, gains, sources }
}

function engineWith(fake: ReturnType<typeof fakeContext>) {
  const createContext = jest.fn(() => fake.context as unknown as AmbientContext)
  const load = jest.fn<(loop: AmbientLoopId) => Promise<ArrayBuffer>>(() =>
    Promise.resolve(new ArrayBuffer(8)),
  )
  return { engine: createAmbientEngine({ createContext, load }), createContext, load }
}

describe('createAmbientEngine', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('reports when the sound can run and tells its listeners', async () => {
    const fake = fakeContext()
    const { engine } = engineWith(fake)
    const listener = jest.fn()
    const unsubscribe = engine.subscribe(listener)

    expect(engine.running()).toBe(false)
    expect(await engine.unlock()).toBe(true)
    expect(engine.running()).toBe(true)
    expect(listener).toHaveBeenCalled()

    listener.mockClear()
    fake.context.onstatechange?.()
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    fake.context.onstatechange?.()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('stays suspended without an error when the browser refuses to start', async () => {
    const fake = fakeContext()
    fake.context.resume.mockImplementation(() => Promise.reject(new Error('not allowed')))
    const { engine } = engineWith(fake)

    expect(await engine.unlock()).toBe(false)
    expect(engine.running()).toBe(false)
  })

  it('creates no audio context until the person starts a sound', () => {
    const fake = fakeContext()
    const { engine, createContext } = engineWith(fake)

    engine.setVolume(0.12)
    engine.setDucked(true)
    engine.stop()

    expect(createContext).not.toHaveBeenCalled()
  })

  it('resumes the context on the first tap and fades the loop in at the chosen volume', async () => {
    const fake = fakeContext()
    const { engine, load } = engineWith(fake)

    engine.setVolume(0.12)
    void engine.unlock()
    engine.play('sea')
    await jest.runOnlyPendingTimersAsync()

    expect(fake.context.resume).toHaveBeenCalled()
    expect(load).toHaveBeenCalledWith('sea')
    const [master, bus, voice] = fake.gains
    expect(master?.gain.value).toBeCloseTo(0.12)
    expect(bus?.gain.targets).toEqual([1])
    expect(voice?.gain.curves).toEqual([10.05, 67.05])
    expect(fake.sources[0]?.starts).toEqual([10.05])
  })

  it('crossfades into the next copy of the loop before the current one ends', async () => {
    const fake = fakeContext()
    const { engine } = engineWith(fake)

    engine.play('rain')
    await jest.advanceTimersByTimeAsync(60_000)

    expect(fake.sources).toHaveLength(2)
    expect(fake.sources[1]?.starts).toEqual([67.05])
  })

  it('lowers under narration, fades out on stop and does not reload a known loop', async () => {
    const fake = fakeContext()
    const { engine, load } = engineWith(fake)
    engine.setVolume(0.2)
    engine.play('forest')
    await jest.runOnlyPendingTimersAsync()

    engine.setDucked(true)
    expect(fake.gains[0]?.gain.targets.at(-1)).toBeCloseTo(0.06)

    engine.stop()
    expect(fake.gains[1]?.gain.targets.at(-1)).toBe(0)
    expect(fake.sources[0]?.stops.at(-1)).toBeCloseTo(13.2)

    engine.play('forest')
    engine.play('forest')
    await jest.runOnlyPendingTimersAsync()
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('serves each loop from the public folder', () => {
    expect(ambientUrl('sea')).toMatch(/^\/audio\/ambient\/sea\.[0-9a-f]{8}\.m4a$/)
  })
})
