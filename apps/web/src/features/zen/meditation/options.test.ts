import { beforeAll, describe, expect, it } from '@jest/globals'
import {
  meditationSegments,
  narrationFingerprint,
  spokenText,
  type NarrationManifest,
} from '@mycogni/domain'
import { meditationOptions, narrationBytesPerSecond, planSeconds } from './options'

function manifestFor(id: 'grief' | 'focus', bytes = 8000 * 5): NarrationManifest {
  const files = Object.fromEntries(
    meditationSegments(id, 'pt-BR', 'long').map((segment) => {
      const fingerprint = narrationFingerprint({
        language: 'pt-BR',
        voice: 'jessica',
        text: spokenText(segment.text),
      })
      return [fingerprint, { path: `pt-BR/jessica/${String(segment.index)}.mp3`, bytes }]
    }),
  )
  return { version: 1, files }
}

describe('meditation options', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.test'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-test-key'
  })

  it('offers only meditations whose every line has narration', () => {
    const options = meditationOptions(manifestFor('grief'), 'pt-BR')

    expect(options.map((option) => option.id)).toEqual(['grief'])
    const [grief] = options
    expect(grief?.title).toBe('Para quem está de luto')
    expect(grief?.topic).toBe('mood')
    expect(grief?.voices.map((voice) => voice.voice)).toEqual(['jessica'])
    expect(grief?.voices[0]?.lines[0]).toEqual({
      index: 0,
      url: 'https://supabase.test/storage/v1/object/public/narration/pt-BR/jessica/0.mp3',
      seconds: 5,
    })
    expect(grief?.plans.short.length).toBeLessThan(grief?.plans.long.length ?? 0)
    expect(grief?.minutes.long).toBeGreaterThan(grief?.minutes.short ?? 0)
  })

  it('offers nothing while the narration is missing', () => {
    const partial = manifestFor('focus')
    const [first] = Object.keys(partial.files)
    const files = Object.fromEntries(
      Object.entries(partial.files).filter(([fingerprint]) => fingerprint !== first),
    )

    expect(meditationOptions({ version: 1, files }, 'pt-BR')).toEqual([])
    expect(meditationOptions({ version: 1, files: {} }, 'en')).toEqual([])
  })

  it('adds voice and silence to the length of a plan', () => {
    expect(
      planSeconds(
        [
          { index: 0, pause: 10 },
          { index: 1, pause: 5 },
        ],
        [{ index: 0, url: 'a', seconds: narrationBytesPerSecond / 1000 }],
      ),
    ).toBe(23)
  })
})
