import { SpeechProviderError, type SpeechProvider, type SpeechRequest } from './provider.ts'

export const elevenLabsUrl = 'https://api.elevenlabs.io'

export const elevenLabsOutputFormat = 'mp3_44100_64'

const retryableStatuses: readonly number[] = [429, 500, 502, 503, 504]

interface ElevenLabsOptions {
  apiKey: string
  attempts?: number
  wait?: (milliseconds: number) => Promise<void>
}

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

export function createElevenLabsProvider({
  apiKey,
  attempts = 3,
  wait = pause,
}: ElevenLabsOptions): SpeechProvider {
  function send({ text, voiceId, modelId, languageCode }: SpeechRequest): Promise<Response> {
    const url = `${elevenLabsUrl}/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${elevenLabsOutputFormat}`
    return fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'content-type': 'application/json', accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: modelId,
        language_code: languageCode,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })
  }

  return {
    async synthesize(request) {
      for (let attempt = 1; ; attempt++) {
        const response = await send(request)
        if (response.ok) {
          return new Uint8Array(await response.arrayBuffer())
        }
        if (attempt >= attempts || !retryableStatuses.includes(response.status)) {
          throw new SpeechProviderError(response.status, await response.text())
        }
        await wait(1000 * 2 ** attempt)
      }
    },
  }
}
