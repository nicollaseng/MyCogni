import { describe, expect, it } from '@jest/globals'
import { assistantLimits } from '@mycogni/domain'
import {
  createElevenLabsTranscriber,
  elevenLabsSpeechToTextUrl,
  scribeModel,
} from '../../src/ai/elevenlabs-transcriber.ts'
import { TranscriptionFailedError } from '../../src/ai/transcriber.ts'
import { loadConfig } from '../../src/config/env.ts'
import { fitToMessage } from '../../src/modules/transcription/transcription.service.ts'

interface Sent {
  url: string
  init: RequestInit
}

function provider(answer: Response | Error, zeroRetention = false) {
  const sent: Sent[] = []
  const transcriber = createElevenLabsTranscriber({
    apiKey: 'test-key',
    zeroRetention,
    send: (url, init) => {
      sent.push({ url, init })
      return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer)
    },
  })
  return { transcriber, sent }
}

const audio = Buffer.from('voice')

describe('ElevenLabs speech to text', () => {
  it('sends only the audio, the model and the language', async () => {
    const { transcriber, sent } = provider(Response.json({ text: 'Oi, tudo bem?' }))

    const text = await transcriber.transcribe({ audio, type: 'audio/webm', language: 'pt' })

    expect(text).toBe('Oi, tudo bem?')
    expect(sent).toHaveLength(1)
    expect(sent[0]?.url).toBe(elevenLabsSpeechToTextUrl)
    expect(sent[0]?.init.method).toBe('POST')
    expect(sent[0]?.init.headers).toEqual({ 'xi-api-key': 'test-key' })
    const form = sent[0]?.init.body
    expect(form).toBeInstanceOf(FormData)
    const fields = form instanceof FormData ? form : new FormData()
    expect([...fields.keys()].sort()).toEqual([
      'file',
      'language_code',
      'model_id',
      'tag_audio_events',
    ])
    expect(fields.get('model_id')).toBe(scribeModel)
    expect(scribeModel).toBe('scribe_v2')
    expect(fields.get('language_code')).toBe('pt')
    expect(fields.get('tag_audio_events')).toBe('false')
    const file = fields.get('file')
    expect(file).toBeInstanceOf(File)
    expect(file instanceof File ? [file.name, file.type, file.size] : []).toEqual([
      'voice.webm',
      'audio/webm',
      audio.length,
    ])
  })

  it('asks for zero retention when the plan allows it', async () => {
    const { transcriber, sent } = provider(Response.json({ text: 'Hi' }), true)

    await transcriber.transcribe({ audio, type: 'audio/mp4', language: 'en' })

    expect(sent[0]?.url).toBe(`${elevenLabsSpeechToTextUrl}?enable_logging=false`)
  })

  it.each([
    ['an error status', new Response('nope', { status: 401 }), 401],
    ['an unexpected answer', Response.json({ words: [] }), 200],
    ['a network failure', new Error('offline'), null],
  ])('fails cleanly on %s', async (_case, answer, status) => {
    const { transcriber } = provider(answer)

    const failure = transcriber.transcribe({ audio, type: 'audio/ogg', language: 'en' })

    await expect(failure).rejects.toBeInstanceOf(TranscriptionFailedError)
    await expect(failure).rejects.toMatchObject({ status })
  })
})

describe('transcribed text', () => {
  it('tidies spaces and fits the message limit at a word boundary', () => {
    expect(fitToMessage('  Oi,\n  tudo   bem? ')).toBe('Oi, tudo bem?')
    const long = Array.from({ length: 400 }, () => 'palavra').join(' ')
    const fitted = fitToMessage(long)
    expect(fitted.length).toBeLessThanOrEqual(assistantLimits.messageLength)
    expect(fitted.endsWith('palavra')).toBe(true)
    expect(fitToMessage('a'.repeat(1200))).toHaveLength(assistantLimits.messageLength)
  })
})

describe('voice configuration', () => {
  const base = {
    DATABASE_URL: 'postgres://localhost:5432/db',
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_SECRET_KEY: 'secret',
    WEB_URL: 'http://localhost:3000',
  }

  it('turns voice on only with a key and keeps zero retention off by default', () => {
    expect(loadConfig(base)).toMatchObject({
      elevenLabsApiKey: null,
      zeroRetentionTranscription: false,
    })
    expect(
      loadConfig({ ...base, ELEVENLABS_API_KEY: 'key', ELEVENLABS_ZERO_RETENTION: 'true' }),
    ).toMatchObject({ elevenLabsApiKey: 'key', zeroRetentionTranscription: true })
  })
})
