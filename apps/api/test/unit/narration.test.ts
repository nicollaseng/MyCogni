import { afterEach, describe, expect, it, jest } from '@jest/globals'
import {
  defaultVoiceFor,
  emptyNarrationManifest,
  narrationFingerprint,
  narrationItems,
  narrationVoiceIds,
  previewNarrationItem,
  type NarrationManifest,
} from '@mycogni/domain'
import { createElevenLabsProvider } from '../../src/narration/elevenlabs.ts'
import {
  charactersOf,
  includesContent,
  planNarration,
  renderNarration,
} from '../../src/narration/generate.ts'
import { createNarrationStore, type NarrationStore } from '../../src/narration/narration-store.ts'
import type { SpeechProvider } from '../../src/narration/provider.ts'

const speech = {
  text: 'Olá.',
  voiceId: 'g6xIsTj2HwM6VR4iXFCw',
  modelId: 'eleven_v4',
  languageCode: 'pt',
}

function audio(): Response {
  return new Response(new Uint8Array([73, 68, 51]), { status: 200 })
}

describe('createElevenLabsProvider', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('asks for a compact MP3 with the key, the model, the language and the voice settings', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(audio())
    const provider = createElevenLabsProvider({ apiKey: 'xi-test' })

    expect(await provider.synthesize(speech)).toEqual(new Uint8Array([73, 68, 51]))
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.elevenlabs.io/v1/text-to-speech/g6xIsTj2HwM6VR4iXFCw?output_format=mp3_44100_64',
      {
        method: 'POST',
        headers: {
          'xi-api-key': 'xi-test',
          'content-type': 'application/json',
          accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: 'Olá.',
          model_id: 'eleven_v4',
          language_code: 'pt',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    )
  })

  it('waits and tries again when the provider is busy', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('busy', { status: 429 }))
      .mockResolvedValueOnce(audio())
    const waits: number[] = []
    const provider = createElevenLabsProvider({
      apiKey: 'xi-test',
      wait: (milliseconds) => {
        waits.push(milliseconds)
        return Promise.resolve()
      },
    })

    await provider.synthesize(speech)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(waits).toEqual([2000])
  })

  it('gives up with the provider answer on other errors or after the last attempt', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('{"detail":"invalid voice"}', { status: 400 }))
    const provider = createElevenLabsProvider({
      apiKey: 'xi-test',
      attempts: 2,
      wait: () => Promise.resolve(),
    })
    await expect(provider.synthesize(speech)).rejects.toThrow('answered 400: {"detail":"invalid')

    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('down', { status: 503 }))
    await expect(provider.synthesize(speech)).rejects.toThrow('answered 503: down')
  })
})

describe('createNarrationStore', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  const store = () => createNarrationStore({ supabaseUrl: 'http://storage.test', secretKey: 'sk' })

  it('reads an empty manifest before the first rendering', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 400 }))
    expect(await store().readManifest()).toEqual(emptyNarrationManifest)
  })

  it('reads and validates the stored manifest', async () => {
    const manifest: NarrationManifest = {
      version: 1,
      files: { '0123456789abcdef': { path: 'en/hope/preview-0123456789abcdef.mp3', bytes: 9 } },
    }
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(manifest), { status: 200 }))
    expect(await store().readManifest()).toEqual(manifest)

    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ version: 2 }), { status: 200 }))
    await expect(store().readManifest()).rejects.toThrow()

    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('no', { status: 500 }))
    await expect(store().readManifest()).rejects.toThrow('read the manifest: 500')
  })

  it('stores audio for a year and the manifest for a minute, replacing older copies', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(new Response('{}', { status: 200 })))
    await store().upload('en/hope/preview-0123456789abcdef.mp3', new Uint8Array([1]))
    await store().writeManifest(emptyNarrationManifest)

    const [audioCall, manifestCall] = fetchMock.mock.calls
    expect(audioCall?.[0]).toBe(
      'http://storage.test/storage/v1/object/narration/en/hope/preview-0123456789abcdef.mp3',
    )
    expect(audioCall?.[1]?.headers).toMatchObject({
      'content-type': 'audio/mpeg',
      'cache-control': 'max-age=31536000',
      'x-upsert': 'true',
      authorization: 'Bearer sk',
    })
    expect(manifestCall?.[0]).toBe('http://storage.test/storage/v1/object/narration/manifest.json')
    expect(manifestCall?.[1]?.headers).toMatchObject({
      'content-type': 'application/json',
      'cache-control': 'max-age=60',
    })
  })

  it('reports a refused upload', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('full', { status: 413 }))
    await expect(store().upload('a.mp3', new Uint8Array([1]))).rejects.toThrow('413 full')
  })
})

describe('planNarration', () => {
  it('renders every item with the default voice and the voice sample with every voice', () => {
    const jobs = planNarration(emptyNarrationManifest, ['pt-BR'], 'default')
    const items = narrationItems('pt-BR')

    expect(jobs).toHaveLength(items.length - 1 + narrationVoiceIds.length)
    expect(
      jobs.filter((job) => job.item.key !== 'preview').every((job) => job.voice === 'jessica'),
    ).toBe(true)
    expect(jobs[0]?.path).toMatch(/^pt-BR\/jessica\/preview-[0-9a-f]{16}\.mp3$/)
    expect(charactersOf(jobs)).toBeGreaterThan(30000)
  })

  it('skips what is already stored and renders only the chosen voices', () => {
    const preview = previewNarrationItem('en')
    const stored = narrationFingerprint({ language: 'en', voice: 'jessica', text: preview.text })
    const manifest: NarrationManifest = {
      version: 1,
      files: { [stored]: { path: 'en/jessica/preview.mp3', bytes: 10 } },
    }

    const jobs = planNarration(manifest, ['en'], ['mark'])

    expect(jobs.some((job) => job.fingerprint === stored)).toBe(false)
    expect(new Set(jobs.map((job) => job.voice))).toEqual(new Set(['hope', 'alexandra', 'mark']))
    expect(
      jobs.filter((job) => job.item.key !== 'preview').every((job) => job.voice === 'mark'),
    ).toBe(true)
    expect(planNarration(emptyNarrationManifest, ['en'], 'all')).toHaveLength(
      narrationItems('en').length * narrationVoiceIds.length,
    )
    expect(defaultVoiceFor('en')).toBe('jessica')
  })
})

describe('planNarration for meditations', () => {
  it('can render only the meditations, one file per line', () => {
    const jobs = planNarration(emptyNarrationManifest, ['pt-BR'], 'default', 'meditations')

    expect(jobs.length).toBeGreaterThan(70)
    expect(jobs.every((job) => job.item.key.startsWith('meditation/'))).toBe(true)
    expect(jobs[0]?.path).toMatch(/^pt-BR\/jessica\/meditation--anxiety--0-[0-9a-f]{16}\.mp3$/)
    expect(charactersOf(jobs)).toBeGreaterThan(7000)
    expect(jobs.some((job) => includesContent('articles', job.item))).toBe(false)
    expect(jobs.every((job) => includesContent('all', job.item))).toBe(true)
  })
})

describe('renderNarration', () => {
  it('renders, uploads and records each narration as it goes', async () => {
    const jobs = planNarration(emptyNarrationManifest, ['en'], 'default').slice(0, 2)
    const requests: string[] = []
    const provider: SpeechProvider = {
      synthesize: (request) => {
        requests.push(`${request.voiceId} ${request.modelId} ${request.languageCode}`)
        return Promise.resolve(new Uint8Array(12))
      },
    }
    const uploads: string[] = []
    const manifests: NarrationManifest[] = []
    const store: NarrationStore = {
      readManifest: () => Promise.resolve(emptyNarrationManifest),
      upload: (path) => {
        uploads.push(path)
        return Promise.resolve()
      },
      writeManifest: (manifest) => {
        manifests.push(manifest)
        return Promise.resolve()
      },
    }
    const messages: string[] = []

    const manifest = await renderNarration({
      jobs,
      manifest: emptyNarrationManifest,
      provider,
      store,
      report: (message) => messages.push(message),
    })

    expect(requests[0]).toBe('g6xIsTj2HwM6VR4iXFCw eleven_v4 en')
    expect(uploads).toEqual(jobs.map((job) => job.path))
    expect(manifests).toHaveLength(2)
    expect(Object.values(manifest.files)).toEqual(
      jobs.map((job) => ({ path: job.path, bytes: 12 })),
    )
    expect(messages[1]).toBe(`2/2 ${jobs[1]?.path ?? ''}`)
  })
})
