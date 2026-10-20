import { ambientLoopFiles, duckedAmbientShare, type AmbientLoopId } from '@mycogni/domain'

export interface AmbientEngine {
  unlock(): Promise<boolean>
  running(): boolean
  subscribe(listener: () => void): () => void
  play(loop: AmbientLoopId): void
  stop(): void
  setVolume(volume: number): void
  setDucked(ducked: boolean): void
}

export type AmbientContext = Pick<
  AudioContext,
  | 'currentTime'
  | 'state'
  | 'onstatechange'
  | 'destination'
  | 'resume'
  | 'createGain'
  | 'createBufferSource'
  | 'decodeAudioData'
>

interface AmbientEngineOptions {
  createContext: () => AmbientContext
  load: (loop: AmbientLoopId) => Promise<ArrayBuffer>
}

interface Session {
  loop: AmbientLoopId
  bus: GainNode
  sources: Set<AudioBufferSourceNode>
  timer: ReturnType<typeof setTimeout> | undefined
  live: boolean
}

export const ambientFadeSeconds = 1.6

export const ambientCrossfadeSeconds = 3

const curveSteps = 64

function curve(rising: boolean): Float32Array {
  return Float32Array.from({ length: curveSteps }, (_, index) => {
    const position = index / (curveSteps - 1)
    return Math.sin(((rising ? position : 1 - position) * Math.PI) / 2)
  })
}

export function ambientUrl(loop: AmbientLoopId): string {
  return `/audio/ambient/${ambientLoopFiles[loop]}`
}

async function fetchLoop(loop: AmbientLoopId): Promise<ArrayBuffer> {
  const response = await fetch(ambientUrl(loop))
  return response.arrayBuffer()
}

function browserContext(): AmbientContext {
  return new AudioContext()
}

export function createAmbientEngine({
  createContext = browserContext,
  load = fetchLoop,
}: Partial<AmbientEngineOptions> = {}): AmbientEngine {
  let audio: { context: AmbientContext; master: GainNode } | null = null
  let volume = 0
  let ducked = false
  let session: Session | null = null
  const buffers = new Map<AmbientLoopId, Promise<AudioBuffer>>()
  const listeners = new Set<() => void>()

  function notify() {
    for (const listener of listeners) {
      listener()
    }
  }

  function ready(): { context: AmbientContext; master: GainNode } {
    if (audio === null) {
      const context = createContext()
      const master = context.createGain()
      master.gain.value = volume * (ducked ? duckedAmbientShare : 1)
      master.connect(context.destination)
      context.onstatechange = notify
      audio = { context, master }
    }
    return audio
  }

  function glide(param: AudioParam, value: number, seconds: number) {
    const { context } = ready()
    param.cancelScheduledValues(context.currentTime)
    param.setTargetAtTime(value, context.currentTime, seconds / 3)
  }

  function bufferOf(loop: AmbientLoopId): Promise<AudioBuffer> {
    const known = buffers.get(loop)
    if (known !== undefined) {
      return known
    }
    const { context } = ready()
    const decoded = load(loop).then((data) => context.decodeAudioData(data))
    void decoded.catch(() => {
      buffers.delete(loop)
    })
    buffers.set(loop, decoded)
    return decoded
  }

  function schedule(current: Session, buffer: AudioBuffer, at: number) {
    const { context } = ready()
    const fade = Math.min(ambientCrossfadeSeconds, buffer.duration / 4)
    const source = context.createBufferSource()
    const gain = context.createGain()
    source.buffer = buffer
    source.connect(gain)
    gain.connect(current.bus)
    gain.gain.setValueCurveAtTime(curve(true), at, fade)
    gain.gain.setValueCurveAtTime(curve(false), at + buffer.duration - fade, fade)
    current.sources.add(source)
    source.onended = () => {
      current.sources.delete(source)
      gain.disconnect()
      if (!current.live && current.sources.size === 0) {
        current.bus.disconnect()
      }
    }
    source.start(at)
    source.stop(at + buffer.duration)
    const next = at + buffer.duration - fade
    current.timer = setTimeout(
      () => {
        if (current.live) {
          schedule(current, buffer, next)
        }
      },
      Math.max(0, (next - context.currentTime - 1) * 1000),
    )
  }

  function end(current: Session) {
    const { context } = ready()
    current.live = false
    clearTimeout(current.timer)
    glide(current.bus.gain, 0, ambientFadeSeconds)
    const silentAt = context.currentTime + ambientFadeSeconds * 2
    for (const source of current.sources) {
      source.stop(silentAt)
    }
  }

  return {
    async unlock() {
      const { context } = ready()
      if (context.state !== 'running') {
        await context.resume().catch(() => undefined)
      }
      notify()
      return context.state === 'running'
    },
    running() {
      return audio?.context.state === 'running'
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    play(loop) {
      if (session?.loop === loop) {
        return
      }
      const { context, master } = ready()
      if (session !== null) {
        end(session)
      }
      const bus = context.createGain()
      bus.gain.value = 0
      bus.connect(master)
      const current: Session = { loop, bus, sources: new Set(), timer: undefined, live: true }
      session = current
      glide(bus.gain, 1, ambientFadeSeconds)
      void bufferOf(loop).then((buffer) => {
        if (current.live) {
          schedule(current, buffer, context.currentTime + 0.05)
        }
      })
    },
    stop() {
      if (session !== null) {
        end(session)
        session = null
      }
    },
    setVolume(next) {
      volume = next
      if (audio !== null) {
        glide(audio.master.gain, volume * (ducked ? duckedAmbientShare : 1), 0.4)
      }
    },
    setDucked(next) {
      ducked = next
      if (audio !== null) {
        glide(audio.master.gain, volume * (ducked ? duckedAmbientShare : 1), 0.8)
      }
    },
  }
}
