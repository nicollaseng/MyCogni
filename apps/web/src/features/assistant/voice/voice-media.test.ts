import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { browserVoiceMedia, MicrophoneDeniedError } from './voice-media'

type Listener = (event: { data: Blob }) => void

class FakeRecorder {
  static supported = new Set(['audio/webm;codecs=opus'])
  static last: FakeRecorder | null = null
  static isTypeSupported(type: string): boolean {
    return FakeRecorder.supported.has(type)
  }
  state: 'inactive' | 'recording' = 'inactive'
  readonly mimeType: string
  private readonly listeners = new Map<string, Listener[]>()

  constructor(_stream: MediaStream, options: { mimeType?: string }) {
    this.mimeType = options.mimeType ?? ''
    FakeRecorder.last = this
  }

  addEventListener(name: string, listener: Listener): void {
    this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener])
  }

  start(): void {
    this.state = 'recording'
  }

  stop(): void {
    this.state = 'inactive'
    this.emit('dataavailable', new Blob(['voice'], { type: this.mimeType }))
    this.emit('stop', new Blob([]))
  }

  private emit(name: string, data: Blob): void {
    for (const listener of this.listeners.get(name) ?? []) {
      listener({ data })
    }
  }
}

const track = { stop: jest.fn() }
const disconnect = jest.fn()
const closeContext = jest.fn(() => Promise.resolve())

class FakeContext {
  static fail = false
  constructor() {
    if (FakeContext.fail) {
      throw new Error('No audio')
    }
  }
  createAnalyser() {
    return {
      fftSize: 0,
      getByteTimeDomainData: (samples: Uint8Array) => {
        samples.fill(255)
      },
    }
  }
  createMediaStreamSource() {
    return { connect: () => undefined, disconnect }
  }
  close = closeContext
}

const stream = { getTracks: () => [track] }
const getUserMedia = jest.fn<() => Promise<unknown>>()

function install(): void {
  Object.assign(window, { MediaRecorder: FakeRecorder, AudioContext: FakeContext })
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  })
}

describe('browser voice media', () => {
  beforeEach(() => {
    install()
    getUserMedia.mockResolvedValue(stream)
    FakeContext.fail = false
  })

  afterEach(() => {
    jest.clearAllMocks()
    Reflect.deleteProperty(window, 'MediaRecorder')
    Reflect.deleteProperty(window, 'AudioContext')
    Reflect.deleteProperty(navigator, 'mediaDevices')
  })

  it('is offered only where the browser can record', () => {
    expect(browserVoiceMedia.supported()).toBe(true)
    Reflect.deleteProperty(window, 'MediaRecorder')
    expect(browserVoiceMedia.supported()).toBe(false)
  })

  it('records opus, reads the live level and stops the microphone when done', async () => {
    const capture = await browserVoiceMedia.open()

    expect(FakeRecorder.last?.state).toBe('recording')
    expect(capture.level()).toBe(1)
    const audio = await capture.finish()

    expect(audio.type).toBe('audio/webm;codecs=opus')
    expect(audio.size).toBeGreaterThan(0)
    expect(track.stop).toHaveBeenCalled()
    expect(disconnect).toHaveBeenCalled()
    expect(closeContext).toHaveBeenCalled()
    expect(capture.level()).toBe(0)
  })

  it('throws the recording away and releases everything on cancel', async () => {
    FakeRecorder.supported = new Set(['audio/mp4'])
    const capture = await browserVoiceMedia.open()

    capture.discard()

    expect(FakeRecorder.last?.mimeType).toBe('audio/mp4')
    expect(FakeRecorder.last?.state).toBe('inactive')
    expect(track.stop).toHaveBeenCalledTimes(1)
    expect(closeContext).toHaveBeenCalledTimes(1)
    capture.discard()
    expect(track.stop).toHaveBeenCalledTimes(1)
    FakeRecorder.supported = new Set(['audio/webm;codecs=opus'])
  })

  it('says the microphone was refused when the person says no', async () => {
    getUserMedia.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'))

    await expect(browserVoiceMedia.open()).rejects.toBeInstanceOf(MicrophoneDeniedError)
  })

  it('passes other failures on and still stops the microphone', async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException('None', 'NotFoundError'))
    await expect(browserVoiceMedia.open()).rejects.toMatchObject({ name: 'NotFoundError' })

    FakeContext.fail = true
    await expect(browserVoiceMedia.open()).rejects.toThrow('No audio')
    expect(track.stop).toHaveBeenCalled()
  })
})
