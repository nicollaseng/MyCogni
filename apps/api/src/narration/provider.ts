export interface SpeechRequest {
  text: string
  voiceId: string
  modelId: string
  languageCode: string
}

export interface SpeechProvider {
  synthesize(request: SpeechRequest): Promise<Uint8Array>
}

export class SpeechProviderError extends Error {
  readonly status: number

  constructor(status: number, detail: string) {
    super(`The speech provider answered ${String(status)}: ${detail.slice(0, 400)}`)
    this.name = 'SpeechProviderError'
    this.status = status
  }
}
