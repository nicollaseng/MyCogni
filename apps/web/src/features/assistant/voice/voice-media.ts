import { levelOf } from './waveform'

export interface VoiceCapture {
  level(): number
  finish(): Promise<Blob>
  discard(): void
}

export interface VoiceMedia {
  supported(): boolean
  open(): Promise<VoiceCapture>
}

export class MicrophoneDeniedError extends Error {
  constructor() {
    super('The microphone was not allowed')
    this.name = 'MicrophoneDeniedError'
  }
}

const preferredTypes = [
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/webm',
]

const deniedErrors: readonly string[] = [
  'NotAllowedError',
  'SecurityError',
  'PermissionDeniedError',
]

function recorderType(): string | undefined {
  return preferredTypes.find((type) => MediaRecorder.isTypeSupported(type))
}

async function microphone(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    })
  } catch (error) {
    throw error instanceof Error && deniedErrors.includes(error.name)
      ? new MicrophoneDeniedError()
      : error
  }
}

function capture(stream: MediaStream): VoiceCapture {
  const preferred = recorderType()
  const recorder = new MediaRecorder(stream, preferred === undefined ? {} : { mimeType: preferred })
  const context = new AudioContext()
  const analyser = context.createAnalyser()
  analyser.fftSize = 1024
  const source = context.createMediaStreamSource(stream)
  source.connect(analyser)
  const samples = new Uint8Array(analyser.fftSize)
  const chunks: Blob[] = []
  let closed = false

  function close(): void {
    if (closed) {
      return
    }
    closed = true
    for (const track of stream.getTracks()) {
      track.stop()
    }
    source.disconnect()
    void context.close().catch(() => undefined)
  }

  function recording(): Blob {
    const type = recorder.mimeType === '' ? (preferred ?? 'audio/webm') : recorder.mimeType
    return new Blob(chunks, { type })
  }

  recorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data)
    }
  })
  recorder.start(250)

  return {
    level() {
      if (closed) {
        return 0
      }
      analyser.getByteTimeDomainData(samples)
      return levelOf(samples)
    },
    finish() {
      return new Promise((resolve) => {
        if (recorder.state === 'inactive') {
          close()
          resolve(recording())
          return
        }
        recorder.addEventListener(
          'stop',
          () => {
            close()
            resolve(recording())
          },
          { once: true },
        )
        recorder.stop()
      })
    },
    discard() {
      if (recorder.state !== 'inactive') {
        recorder.stop()
      }
      chunks.length = 0
      close()
    },
  }
}

export const browserVoiceMedia: VoiceMedia = {
  supported() {
    return (
      typeof window !== 'undefined' &&
      typeof window.MediaRecorder === 'function' &&
      typeof window.AudioContext === 'function' &&
      'mediaDevices' in navigator &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    )
  },
  async open() {
    const stream = await microphone()
    try {
      return capture(stream)
    } catch (error) {
      for (const track of stream.getTracks()) {
        track.stop()
      }
      throw error
    }
  },
}
