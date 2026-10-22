import type { VoiceAudioType } from '@mycogni/domain'
import { z } from 'zod'
import { TranscriptionFailedError, type Transcriber } from './transcriber.ts'

export const elevenLabsSpeechToTextUrl = 'https://api.elevenlabs.io/v1/speech-to-text'

export const scribeModel = 'scribe_v2'

const timeoutMs = 45_000

const extensions: Readonly<Record<VoiceAudioType, string>> = {
  'audio/webm': 'webm',
  'audio/mp4': 'mp4',
  'audio/ogg': 'ogg',
}

const answerSchema = z.object({ text: z.string() })

type Fetch = (input: string, init: RequestInit) => Promise<Response>

interface ElevenLabsTranscriberOptions {
  apiKey: string
  zeroRetention?: boolean
  send?: Fetch
}

export function createElevenLabsTranscriber({
  apiKey,
  zeroRetention = false,
  send = fetch,
}: ElevenLabsTranscriberOptions): Transcriber {
  const url = zeroRetention
    ? `${elevenLabsSpeechToTextUrl}?enable_logging=false`
    : elevenLabsSpeechToTextUrl
  return {
    async transcribe({ audio, type, language }) {
      const form = new FormData()
      form.set('model_id', scribeModel)
      form.set('language_code', language)
      form.set('tag_audio_events', 'false')
      form.set('file', new Blob([new Uint8Array(audio)], { type }), `voice.${extensions[type]}`)
      const response = await send(url, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: form,
        signal: AbortSignal.timeout(timeoutMs),
      }).catch(() => {
        throw new TranscriptionFailedError(null)
      })
      if (!response.ok) {
        throw new TranscriptionFailedError(response.status)
      }
      const answer = answerSchema.safeParse(await response.json().catch(() => null))
      if (!answer.success) {
        throw new TranscriptionFailedError(response.status)
      }
      return answer.data.text
    },
  }
}
