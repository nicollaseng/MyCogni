import type { TranscriptionLanguage, VoiceAudioType } from '@mycogni/domain'

export interface TranscriptionRequest {
  audio: Buffer
  type: VoiceAudioType
  language: TranscriptionLanguage
}

export interface Transcriber {
  transcribe(request: TranscriptionRequest): Promise<string>
}

export class TranscriptionFailedError extends Error {
  readonly status: number | null

  constructor(status: number | null) {
    super(`Transcription failed${status === null ? '' : ` with status ${String(status)}`}`)
    this.name = 'TranscriptionFailedError'
    this.status = status
  }
}
