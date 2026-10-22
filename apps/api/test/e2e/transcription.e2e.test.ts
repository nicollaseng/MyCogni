import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals'
import type { AssistantOverview, Transcription } from '@mycogni/contracts'
import { voiceLimits } from '@mycogni/domain'
import {
  createScriptedTranscriber,
  scriptedTranscriptions,
} from '../../src/ai/scripted-transcriber.ts'
import type { TranscriptionRequest, Transcriber } from '../../src/ai/transcriber.ts'
import { TranscriptionFailedError } from '../../src/ai/transcriber.ts'
import { connectDatabase, type DatabaseConnection } from '../../src/db/client.ts'
import type { App } from '../../src/shared/http.ts'
import { registerProfessional } from '../support/care.ts'
import { testDatabaseUrl } from '../support/database.ts'
import { bearer, createTestUser, deleteTestUser, type TestUser } from '../support/supabase.ts'
import { buildTestApp, supabaseVerifier, testConfig } from '../support/test-app.ts'

class RecordingTranscriber implements Transcriber {
  readonly requests: TranscriptionRequest[] = []
  failure: Error | null = null
  private readonly scripted = createScriptedTranscriber()

  transcribe(request: TranscriptionRequest): Promise<string> {
    this.requests.push(request)
    return this.failure === null ? this.scripted.transcribe(request) : Promise.reject(this.failure)
  }
}

const voice = Buffer.from('a short voice message')

describe('/v1/assistant/transcriptions', () => {
  let app: App
  let silent: App
  let connection: DatabaseConnection
  let ana: TestUser
  let helena: TestUser
  const transcriber = new RecordingTranscriber()

  function transcribe(
    target: App,
    user: TestUser | null,
    payload: Buffer | string,
    contentType = 'audio/webm;codecs=opus',
    locale = 'pt-BR',
  ) {
    return target.inject({
      method: 'POST',
      url: `/v1/assistant/transcriptions?locale=${locale}`,
      headers: { ...(user === null ? {} : bearer(user)), 'content-type': contentType },
      payload,
    })
  }

  beforeAll(async () => {
    connection = connectDatabase(testDatabaseUrl)
    app = await buildTestApp({ db: connection.db, verifier: supabaseVerifier(), transcriber })
    silent = await buildTestApp({ db: connection.db, verifier: supabaseVerifier() })
    await Promise.all([app.ready(), silent.ready()])
    ana = await createTestUser({ full_name: 'Ana Lima' })
    helena = await createTestUser({ full_name: 'Helena Prado' })
    await registerProfessional(connection.db, helena.id)
  })

  beforeEach(() => {
    transcriber.requests.length = 0
    transcriber.failure = null
  })

  afterAll(async () => {
    for (const user of [ana, helena]) {
      await deleteTestUser(user.id)
    }
    await Promise.all([app.close(), silent.close()])
    await connection.close()
  })

  it('turns a voice message into text in the person’s language without keeping the audio', async () => {
    const response = await transcribe(app, ana, voice)

    expect(response.statusCode).toBe(200)
    expect(response.json<Transcription>()).toEqual({ text: scriptedTranscriptions.pt })
    expect(transcriber.requests).toHaveLength(1)
    expect(transcriber.requests[0]?.type).toBe('audio/webm')
    expect(transcriber.requests[0]?.language).toBe('pt')
    expect(transcriber.requests[0]?.audio.equals(voice)).toBe(true)

    const english = await transcribe(app, ana, voice, 'audio/mp4', 'en-GB')
    expect(english.json<Transcription>()).toEqual({ text: scriptedTranscriptions.en })
    expect(transcriber.requests[1]).toMatchObject({ type: 'audio/mp4', language: 'en' })
  })

  it('works for professionals too', async () => {
    const response = await transcribe(app, helena, voice, 'audio/ogg; codecs=opus')

    expect(response.statusCode).toBe(200)
  })

  it('needs a signed-in person', async () => {
    expect((await transcribe(app, null, voice)).statusCode).toBe(401)
    expect(transcriber.requests).toHaveLength(0)
  })

  it('accepts only audio of a known kind, not empty and up to five megabytes', async () => {
    const json = await app.inject({
      method: 'POST',
      url: '/v1/assistant/transcriptions?locale=pt-BR',
      headers: bearer(ana),
      payload: { text: 'oi' },
    })
    const video = await transcribe(app, ana, voice, 'video/webm')
    const wave = await transcribe(app, ana, voice, 'audio/wav')
    const empty = await transcribe(app, ana, Buffer.alloc(0))
    const large = await transcribe(app, ana, Buffer.alloc(voiceLimits.maxBytes + 1))
    const noLocale = await app.inject({
      method: 'POST',
      url: '/v1/assistant/transcriptions',
      headers: { ...bearer(ana), 'content-type': 'audio/webm' },
      payload: voice,
    })

    expect(json.statusCode).toBe(415)
    expect(video.statusCode).toBe(415)
    expect(wave.statusCode).toBe(415)
    expect(empty.statusCode).toBe(400)
    expect(large.statusCode).toBe(413)
    expect(noLocale.statusCode).toBe(400)
    expect(transcriber.requests).toHaveLength(0)
  })

  it('answers 503 and tells the chat to hide the microphone when there is no provider', async () => {
    const response = await transcribe(silent, ana, voice)
    const withVoice = await app.inject({
      method: 'GET',
      url: '/v1/assistant',
      headers: bearer(ana),
    })
    const withoutVoice = await silent.inject({
      method: 'GET',
      url: '/v1/assistant',
      headers: bearer(ana),
    })

    expect(response.statusCode).toBe(503)
    expect(response.json()).toMatchObject({ code: 'VOICE_UNAVAILABLE' })
    expect(withVoice.json<AssistantOverview>().voice).toBe(true)
    expect(withoutVoice.json<AssistantOverview>().voice).toBe(false)
  })

  it('answers 502 without details when the provider fails', async () => {
    transcriber.failure = new TranscriptionFailedError(500)

    const response = await transcribe(app, ana, voice)

    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchObject({ code: 'VOICE_FAILED' })
  })

  it('limits voice messages per person per hour', async () => {
    const limited = await buildTestApp({
      db: connection.db,
      verifier: supabaseVerifier(),
      transcriber,
      config: { ...testConfig, redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:56379' },
    })
    await limited.ready()
    const person = await createTestUser({ full_name: 'Caio Duarte' })
    const statuses: number[] = []
    for (let index = 0; index <= voiceLimits.hourlyTranscriptions; index++) {
      statuses.push((await transcribe(limited, person, voice)).statusCode)
    }
    await limited.close()
    await deleteTestUser(person.id)

    expect(statuses.slice(0, voiceLimits.hourlyTranscriptions).every((s) => s === 200)).toBe(true)
    expect(statuses[voiceLimits.hourlyTranscriptions]).toBe(429)
  })
})
